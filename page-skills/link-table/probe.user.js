// ==UserScript==
// @name         link-table probe
// @match        *://*/*
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  return null; // 导出型无判定腿
}
/* @enddetect */
(function () {
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  window.__browseLinks = window.__browseLinks || { seen: {}, count: 0 };
  function scan() {
    var as = document.querySelectorAll('a[href]');
    var cap = Math.min(as.length, 3000);
    var L = window.__browseLinks;
    for (var i = 0; i < cap; i++) {
      var h = as[i].href;
      if (h && !L.seen[h]) { L.seen[h] = 1; L.count++; }
    }
  }
  scan();
  new MutationObserver(function () { scan(); }).observe(document.documentElement, { childList: true, subtree: true });
  // 停止信号到达时(滚动/翻页对发的),把终值留在 window 上供 mech 读
  setInterval(function () {}, 10000);
})();
