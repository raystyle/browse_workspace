// ==UserScript==
// @name         gm-bridge probe
// @match        http://127.0.0.1:8871/*
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  return null; // 服务对无判定腿(不点名)
}
/* @enddetect */
(function () {
  // GM 服务桥:跨世界经 DOM CustomEvent RPC(三世界 DOM 共享、JS 对象不通,
  // 事件是唯一双向道)。rn/主世界 dispatch 'browse-gm-req' {id,kind,...},
  // 本桥在油猴世界执行 GM 特权后 dispatch 'browse-gm-res' {id,...}。
  // 服务面:fetch(GM_xhr 跨域+引擎会话 cookie)/kv-get/kv-set(跨导航持久)。
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  document.addEventListener('browse-gm-req', function (e) {
    var d = e.detail || {};
    var reply = function (payload) {
      try {
        document.dispatchEvent(new CustomEvent('browse-gm-res', {
          detail: Object.assign({ id: d.id, kind: d.kind }, payload)
        }));
      } catch (err) {}
    };
    if (d.kind === 'fetch') {
      GM_xmlhttpRequest({
        method: d.method || 'GET',
        url: String(d.url || ''),
        headers: d.headers || {},
        data: d.body || null,
        timeout: d.timeoutMs || 15000,
        onload: function (r) { reply({ ok: true, status: r.status, body: String(r.responseText || '') }); },
        onerror: function () { reply({ ok: false, status: 0, body: '' }); },
        ontimeout: function () { reply({ ok: false, status: -1, body: '' }); }
      });
    } else if (d.kind === 'kv-get') {
      reply({ ok: true, value: GM_getValue(String(d.key || '')) });
    } else if (d.kind === 'kv-set') {
      GM_setValue(String(d.key || ''), d.value);
      reply({ ok: true });
    } else {
      reply({ ok: false, error: 'unknown-kind' });
    }
  });
  // 在位标记(DOM 跨世界可见):rn 可单读此属性判桥就绪
  document.documentElement.setAttribute('us-gm-bridge', 'ready');
})();
