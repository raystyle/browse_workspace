// spa-route 页内侧体(REQ-041 P1 件3 迁 SDK 编译道;源 page-skills 单件遗产,逻辑逐字)
// 采集腿(@run-at document-start):主世界包 history(Symbol 防双包),pushState/replaceState/
// popstate/hashchange 四道路由变化打 see.spa-route 摘要。
declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;

(function () {
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
  var KEY = '__browseRouteWrapped';
  try {
    var H = history as unknown as Record<string, unknown>;
    if (!H[KEY]) {
      var wp = history.pushState.bind(history);
      var wr = history.replaceState.bind(history);
      history.pushState = function () { var r = wp.apply(history, arguments as unknown as []); report('pushState'); return r; };
      history.replaceState = function () { var r = wr.apply(history, arguments as unknown as []); report('replaceState'); return r; };
      Object.defineProperty(history, KEY, { value: true });
    }
  } catch (e) {}
  window.addEventListener('popstate', function () { report('popstate'); });
  window.addEventListener('hashchange', function () { report('hashchange'); });
})();
