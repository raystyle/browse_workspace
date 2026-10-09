// ==UserScript==
// @name         next-page probe
// @match        *://*/*
// @connect      127.0.0.1
// @grant GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  if (facts.hasRelNext) {
    return { slug: 'next-page', confidence: 'CONFIRMED' };
  }
  return null;
}
/* @enddetect */
(function () {
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var lastHtml = null;
  function pageSig() {
    var m = document.querySelector('main,[role=main],#content,.content') || document.body;
    return (m ? m.innerHTML.length : 0) + ':' + location.pathname;
  }
  function stop(data) {
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'http://127.0.0.1:' + PORT + '/userscript/stop',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(Object.assign({ slug: 'next-page', url: location.href }, { data: data }))
    });
  }
  function check() {
    var next = document.querySelector('a[rel=next],[rel="next"],[aria-label="Next"],a[aria-label="next"],a.next,a[title="Next"]');
    var sig = pageSig();
    var samePage = lastHtml !== null && sig === lastHtml;
    lastHtml = sig;
    if (!next || next.disabled || next.getAttribute('aria-disabled') === 'true') {
      stop({ reason: 'no-next', sig: sig });
      return true;
    }
    if (samePage) {
      stop({ reason: 'empty-turn', sig: sig });
      return true;
    }
    return false;
  }
  if (!check()) {
    new MutationObserver(function () { check(); }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
