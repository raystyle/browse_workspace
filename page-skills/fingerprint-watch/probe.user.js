// ==UserScript==
// @name         fingerprint-watch probe
// @match        *://*/*
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  return null; // 观察型无判定腿(指纹 API 在正常页也会跑,不点名)
}
/* @enddetect */
(function () {
  // 包 canvas/audio/字体测量/webdriver 读:原样调用原函数,只计数(不改返回值)
  var counts = {};
  function wrap(obj, name, key) {
    try {
      var orig = obj[name];
      if (typeof orig !== 'function' || orig.__fpw) return;
      var w = function () { counts[key] = (counts[key] || 0) + 1; return orig.apply(this, arguments); };
      w.__fpw = true;
      obj[name] = w;
    } catch (e) {}
  }
  wrap(HTMLCanvasElement.prototype, 'toDataURL', 'canvas.toDataURL');
  wrap(HTMLCanvasElement.prototype, 'getContext', 'canvas.getContext');
  if (window.OfflineAudioContext) wrap(window, 'OfflineAudioContext', 'OfflineAudioContext');
  if (window.HTMLFontFaceElement || document.fonts) {
    try { wrap(document.fonts, 'check', 'fonts.check'); } catch (e) {}
  }
  var wdCount = 0;
  try {
    var nd = Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver');
    if (nd && nd.get) {
      Object.defineProperty(Navigator.prototype, 'webdriver', {
        get: function () { wdCount++; return nd.get.call(this); }
      });
    }
  } catch (e) {}
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  function report() {
    var apis = [];
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
