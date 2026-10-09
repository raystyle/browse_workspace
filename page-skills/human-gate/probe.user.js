// ==UserScript==
// @name         human-gate probe
// @match        http://127.0.0.1:8871/*
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @run-at       document-idle
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  return null; // 服务对无判定腿
}
/* @enddetect */
(function () {
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var fired = false;
  function signal(source) {
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
  document.addEventListener('browse-human-arm', function (e) {
    var msg = (e.detail && e.detail.message) || '需要人工操作';
    try { GM_notification({ title: 'browse human-gate', text: msg, timeout: 0 }); } catch (err) {}
    try { GM_registerMenuCommand('人工完成 → 放行', function () { signal('menu'); }); } catch (err) {}
    document.documentElement.setAttribute('us-human-armed', '1');
  });
  // 放行道:真人在管理页菜单点「人工完成」,或测试/编排 dispatch 'browse-human-done'
  document.addEventListener('browse-human-done', function () { signal('event'); });
})();
