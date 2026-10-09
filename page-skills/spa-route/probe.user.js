// ==UserScript==
// @name         spa-route probe
// @match        *://*/*
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  if (facts.framework) {
    return { slug: 'spa-route', confidence: 'PLAUSIBLE' };
  }
  return null;
}
/* @enddetect */
(function () {
  // 主世界包 history(Symbol 防双包),路由变化打 see.spa-route 摘要
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var last = location.href;
  function report(type) {
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
    if (!history[KEY]) {
      var wp = history.pushState.bind(history);
      var wr = history.replaceState.bind(history);
      history.pushState = function () { var r = wp.apply(history, arguments); report('pushState'); return r; };
      history.replaceState = function () { var r = wr.apply(history, arguments); report('replaceState'); return r; };
      Object.defineProperty(history, KEY, { value: true });
    }
  } catch (e) {}
  window.addEventListener('popstate', function () { report('popstate'); });
  window.addEventListener('hashchange', function () { report('hashchange'); });
})();
