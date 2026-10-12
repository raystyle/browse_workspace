// scroll-until-end 页内侧体(REQ-041 P1 件3 迁 SDK 编译道;源 page-skills 单件遗产,逻辑逐字)
// 滚底腿:MutationObserver 数列表子节点增量;连续 3 拍无新增 → 稳定,打 /userscript/stop。
declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;

(function () {
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var last = 0, stable = 0, fired = false;
  function count(): number {
    return document.getElementsByTagName('*').length;
  }
  function settle(): void {
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
