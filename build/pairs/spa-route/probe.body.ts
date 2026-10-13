// spa-route 页内侧体(REQ-041 P1 件3 迁 SDK 编译道;Katana 课:封死 history,已封走登记表)
// 采集腿(@run-at document-start):经 unsafeWindow 包页面主世界 history。
declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;
declare const unsafeWindow: (Window & Record<string, unknown>) | undefined;

(function () {
  var page: Window & Record<string, unknown> = (typeof unsafeWindow !== 'undefined' && unsafeWindow)
    ? unsafeWindow
    : (window as Window & Record<string, unknown>);
  var hist = page.history;
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var last = location.href;
  function report(type: string): void {
    if (location.href === last && type !== 'popstate') return;
    last = location.href;
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'http://127.0.0.1:' + PORT + '/events',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ type: 'see', slug: 'spa-route', url: location.href, data: { kind: type } })
    });
  }
  function fan(kind: string): void {
    report(kind);
    var hooks = page.__browseRouteHooks as Array<(e: { kind: string }) => void> | undefined;
    if (!hooks) return;
    for (var i = 0; i < hooks.length; i++) {
      try { hooks[i]({ kind: kind }); } catch (e) {}
    }
  }
  function seal(name: string, fn: (...a: unknown[]) => unknown): void {
    try {
      Object.defineProperty(hist, name, { value: fn, writable: false, configurable: false });
    } catch (e) {
      try { (hist as unknown as Record<string, unknown>)[name] = fn; } catch (e2) {}
    }
  }
  var KEY = '__browseRouteWrapped';
  var desc: PropertyDescriptor | undefined;
  try { desc = Object.getOwnPropertyDescriptor(hist, 'pushState'); } catch (e) {}
  var sealed = !!(desc && desc.configurable === false);
  try {
    if (sealed) {
      if (!page.__browseSpaJoined) {
        page.__browseSpaJoined = true;
        var joined = (page.__browseRouteHooks as Array<(e: { kind: string }) => void> | undefined) || [];
        page.__browseRouteHooks = joined;
        joined.push(function (e) { report(e && e.kind); });
      }
    } else if (!(hist as unknown as Record<string, unknown>)[KEY]) {
      var wp = hist.pushState.bind(hist);
      var wr = hist.replaceState.bind(hist);
      seal('pushState', function () { var r = wp.apply(hist, arguments as unknown as []); fan('pushState'); return r; });
      seal('replaceState', function () { var r = wr.apply(hist, arguments as unknown as []); fan('replaceState'); return r; });
      try { Object.defineProperty(hist, KEY, { value: true }); } catch (e) {}
    }
  } catch (e) {}
  page.addEventListener('popstate', function () { report('popstate'); });
  page.addEventListener('hashchange', function () { report('hashchange'); });
})();
