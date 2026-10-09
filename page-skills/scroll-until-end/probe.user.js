// ==UserScript==
// @name         scroll-until-end probe
// @match        *://*/*
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  if (facts.viewportHeight > 0 && facts.docHeight >= 4 * facts.viewportHeight) {
    return { slug: 'scroll-until-end', confidence: 'PLAUSIBLE' };
  }
  return null;
}
/* @enddetect */
(function () {
  // MutationObserver 数列表子节点增量;连续 N 次无新增 → 稳定,打 stop。
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var last = 0, stable = 0, fired = false;
  function count() {
    return document.getElementsByTagName('*').length;
  }
  function settle() {
    if (fired) return;
    var n = count();
    if (n === last) stable++; else { stable = 0; last = n; }
    if (stable >= 3) {
      fired = true;
      GM_xmlhttpRequest({
        method: 'POST',
        url: 'http://127.0.0.1:' + PORT + '/userscript/stop',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ slug: 'scroll-until-end', url: location.href, data: { nodes: n, reason: 'stable' } })
      });
    }
  }
  last = count();
  new MutationObserver(function () { stable = 0; }).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(settle, 1200);
})();
