// response-tap 页内侧体(REQ-041 P1 件3 迁 SDK 编译道;源 page-skills 单件遗产,逻辑逐字)
// 采集腿:旁路钩 fetch/XHR(@run-at document-start),clone 后按 window.__RT_FILTER 过滤,
// 全量留页面内存(mech 一次读走),事件环只打摘要。Symbol 防双包(__browseTap.fetchWrapped)。
declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;

(function () {
  (window as unknown as Record<string, unknown>).__browseTap = (window as unknown as Record<string, unknown>).__browseTap || { filters: [], buf: [], seq: 0 };
  var T = (window as unknown as { __browseTap: { filters: string[]; buf: Record<string, unknown>[]; seq: number; fetchWrapped?: boolean } }).__browseTap;
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var BODY_CAP = 256 * 1024; // 单条 body 上限(内存护栏)
  var N_CAP = 2000;          // 缓冲条数上限
  function match(url: string): boolean {
    var f = (window as unknown as { __RT_FILTER?: string[] }).__RT_FILTER;
    if (!f || !f.length) return true;
    for (var i = 0; i < f.length; i++) if (url.indexOf(f[i]) >= 0) return true;
    return false;
  }
  function keep(url: string, status: number, body: unknown): void {
    if (!match(url)) return;
    if (T.buf.length >= N_CAP) T.buf.shift();
    T.buf.push({ url: url, status: status, body: ('' + body).slice(0, BODY_CAP), ts: Date.now(), seq: T.seq++ });
  }
  function summary(url: string, status: number, bytes: number, keys: unknown): void {
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'http://127.0.0.1:' + PORT + '/events',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ type: 'see', slug: 'response-tap', url: location.href, data: { hit: url, status: status, bytes: bytes, topKeys: keys } })
    });
  }
  if (!T.fetchWrapped) {
    T.fetchWrapped = true;
    var of = (window as unknown as { fetch?: ((...a: unknown[]) => Promise<unknown>) }).fetch;
    if (of) {
      (window as unknown as { fetch: unknown }).fetch = function () {
        var args = arguments;
        return of.apply(this, args as unknown as []).then(function (resp: { clone: () => { text: () => Promise<string> }; status: number }) {
          try {
            var a0 = args[0] as { url?: string } | undefined;
            var u = '' + (a0 && a0.url || args[0]);
            if (match(u)) {
              var c = resp.clone();
              c.text().then(function (tx: string) {
                var keys: unknown = null;
                try { keys = Object.keys(JSON.parse(tx)).slice(0, 12); } catch (e) {}
                keep(u, resp.status, tx);
                summary(u, resp.status, tx.length, keys);
              }).catch(function () {});
            }
          } catch (e) {}
          return resp;
        });
      };
    }
    var oo = XMLHttpRequest.prototype.open, os = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, m: string, u: string) { (this as unknown as { __rtUrl?: string }).__rtUrl = u; return oo.apply(this, arguments as unknown as []); };
    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest) {
      var xhr = this;
      xhr.addEventListener('load', function () {
        try {
          var u = '' + (xhr as unknown as { __rtUrl?: string }).__rtUrl;
          if (match(u)) {
            var tx = xhr.responseType === 'json' ? JSON.stringify(xhr.response) : ('' + (xhr.responseText || ''));
            var keys: unknown = null;
            try { keys = Object.keys(JSON.parse(tx)).slice(0, 12); } catch (e) {}
            keep(u, xhr.status, tx);
            summary(u, xhr.status, tx.length, keys);
          }
        } catch (e) {}
      });
      return os.apply(this, arguments as unknown as []);
    };
  }
})();
