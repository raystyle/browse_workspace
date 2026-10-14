// ==UserScript==
// @name         gm-bridge probe
// @match        http://127.0.0.1:8871/*
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  return null; // 服务对无判定腿(不点名)
}
/* @enddetect */
(function () {
  // GM 服务桥:跨世界经 DOM CustomEvent RPC。页面也能发同一事件,
  // 所以白名单不读事件、不读 DOM,只认本文件里的前缀表。
  // 改表 = 改本文件再 userscript install。空表即全部 fetch 拒绝。
  var ALLOW_FETCH = ['http://127.0.0.1:8872/'];
  function allowed(url) {
    url = String(url || '');
    for (var i = 0; i < ALLOW_FETCH.length; i++) {
      if (url.indexOf(ALLOW_FETCH[i]) === 0) return true;
    }
    return false;
  }
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
      if (!allowed(d.url)) {
        reply({ ok: false, error: 'deny', status: 0, body: '' });
        return;
      }
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
    } else if (d.kind === 'kv-get' || d.kind === 'kv-set') {
      reply({ ok: false, error: 'deny' });
    } else {
      reply({ ok: false, error: 'unknown-kind' });
    }
  });
  document.documentElement.setAttribute('us-gm-bridge', 'ready');
})();
