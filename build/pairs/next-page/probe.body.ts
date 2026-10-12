// next-page 页内侧体(REQ-041 P1 件3 迁 SDK 编译道;源 page-skills 单件遗产,逻辑逐字)
// 翻页腿:翻到没有下一页或空转(页签名不变)即 /userscript/stop 打断宿主 mech。
declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;

(function () {
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var lastHtml: string | null = null;
  function pageSig(): string {
    var m = document.querySelector('main,[role=main],#content,.content') || document.body;
    return (m ? m.innerHTML.length : 0) + ':' + location.pathname;
  }
  function stop(data: Record<string, unknown>): void {
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'http://127.0.0.1:' + PORT + '/userscript/stop',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(Object.assign({ slug: 'next-page', url: location.href }, { data: data }))
    });
  }
  function check(): boolean {
    var next = document.querySelector('a[rel=next],[rel="next"],[aria-label="Next"],a[aria-label="next"],a.next,a[title="Next"]');
    var sig = pageSig();
    var samePage = lastHtml !== null && sig === lastHtml;
    lastHtml = sig;
    if (!next || (next as HTMLInputElement).disabled || next.getAttribute('aria-disabled') === 'true') {
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
