// human-gate 页内侧体(REQ-041 P1 件3 迁 SDK 编译道;源 page-skills 单件遗产,逻辑逐字)
// 服务腿:武装道(browse-human-arm → 通知+菜单项)与放行道(browse-human-done/菜单)。
// 放行写 us-human-done 属性(DOM 跨世界道)+ /events 上报;零轮询。
declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;
declare const GM_registerMenuCommand: (title: string, fn: () => void) => void;
declare const GM_notification: (o: { title: string; text: string; timeout: number }) => void;

(function () {
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var fired = false;
  function signal(source: string): void {
    if (fired) return;
    fired = true;
    document.documentElement.setAttribute('us-human-done', source); // DOM 跨世界:rn 零轮询等此属性/事件
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'http://127.0.0.1:' + PORT + '/events',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ type: 'see', slug: 'human-gate', url: location.href, data: { source: source } })
    });
  }
  // 武装道:任意世界 dispatch 'browse-human-arm' {message} → 桌面通知+菜单项
  document.addEventListener('browse-human-arm', function (e: Event) {
    var msg = ((e as CustomEvent).detail && (e as CustomEvent).detail.message) || '需要人工操作';
    try { GM_notification({ title: 'browse human-gate', text: msg, timeout: 0 }); } catch (err) {}
    try { GM_registerMenuCommand('人工完成 → 放行', function () { signal('menu'); }); } catch (err) {}
    document.documentElement.setAttribute('us-human-armed', '1');
  });
  // 放行道:真人在管理页菜单点「人工完成」,或测试/编排 dispatch 'browse-human-done'
  document.addEventListener('browse-human-done', function () { signal('event'); });
})();
