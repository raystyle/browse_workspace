// link-table 页内侧体(REQ-041 P1 件3 迁 SDK 编译道;源 page-skills 单件遗产,逻辑逐字)
// 导出腿:去重收链接到 window.__browseLinks(上限 3000),终值留页面内存供 mech 一次读走;零 GM 面。
(function () {
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  (window as unknown as { __browseLinks?: { seen: Record<string, 1>; count: number } }).__browseLinks =
    (window as unknown as { __browseLinks?: { seen: Record<string, 1>; count: number } }).__browseLinks || { seen: {}, count: 0 };
  function scan(): void {
    var as = document.querySelectorAll('a[href]');
    var cap = Math.min(as.length, 3000);
    var L = (window as unknown as { __browseLinks: { seen: Record<string, 1>; count: number } }).__browseLinks;
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
