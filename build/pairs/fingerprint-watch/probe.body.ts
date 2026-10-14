// fingerprint-watch 页内侧体(REQ-041 P1 件3 迁 SDK 编译道;源 page-skills 单件遗产,逻辑逐字)
// 观察腿(@run-at document-start):包 canvas/audio/字体测量/webdriver 读,原样调用只计数,不改返回值。
declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;

(function () {
  var counts: Record<string, number> = {};
  function wrap(obj: unknown, name: string, key: string): void {
    try {
      var o = obj as Record<string, unknown>;
      var orig = o[name] as ((...a: unknown[]) => unknown) & { __fpw?: boolean };
      if (typeof orig !== 'function' || orig.__fpw) return;
      var w = function (this: unknown) { counts[key] = (counts[key] || 0) + 1; return orig.apply(this, arguments as unknown as []); };
      (w as unknown as { __fpw: boolean }).__fpw = true;
      o[name] = w;
    } catch (e) {}
  }
  wrap(HTMLCanvasElement.prototype, 'toDataURL', 'canvas.toDataURL');
  wrap(HTMLCanvasElement.prototype, 'getContext', 'canvas.getContext');
  if ((window as unknown as { OfflineAudioContext?: unknown }).OfflineAudioContext) wrap(window, 'OfflineAudioContext', 'OfflineAudioContext');
  if ((window as unknown as { HTMLFontFaceElement?: unknown }).HTMLFontFaceElement || document.fonts) {
    try { wrap(document.fonts, 'check', 'fonts.check'); } catch (e) {}
  }
  var wdCount = 0;
  try {
    var nd = Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver');
    if (nd && nd.get) {
      Object.defineProperty(Navigator.prototype, 'webdriver', {
        get: function (this: Navigator) { wdCount++; return nd!.get!.call(this); }
      });
    }
  } catch (e) {}
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  function report(): void {
    var apis: { name: string; count: number }[] = [];
    Object.keys(counts).forEach(function (k) { apis.push({ name: k, count: counts[k] }); });
    if (wdCount > 0) apis.push({ name: 'navigator.webdriver', count: wdCount });
    if (!apis.length) return;
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'http://127.0.0.1:' + PORT + '/events',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ type: 'see', slug: 'fingerprint-watch', url: location.href, data: { apis: apis } })
    });
  }
  window.addEventListener('beforeunload', report);
  setTimeout(report, 8000);
})();
