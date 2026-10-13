// response-tap 页内侧体(REQ-041 P1 件3 迁 SDK;Katana 课:另记 open/WebSocket/EventSource)
// 采集腿:经 unsafeWindow 旁路钩页面主世界 fetch/XHR,并记 open/ws/es 的 URL。
declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;
declare const unsafeWindow: (Window & Record<string, unknown>) | undefined;

type Tap = {
  filters: string[];
  buf: Record<string, unknown>[];
  seq: number;
  fetchWrapped?: boolean;
  openWrapped?: boolean;
  wsWrapped?: boolean;
  esWrapped?: boolean;
};

(function () {
  var page: Record<string, unknown> = (typeof unsafeWindow !== 'undefined' && unsafeWindow)
    ? (unsafeWindow as unknown as Record<string, unknown>)
    : (window as unknown as Record<string, unknown>);
  page.__browseTap = page.__browseTap || { filters: [], buf: [], seq: 0 };
  var T = page.__browseTap as Tap;
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var BODY_CAP = 256 * 1024;
  var N_CAP = 2000;
  function match(url: string): boolean {
    var f = page.__RT_FILTER as string[] | undefined;
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
  function note(kind: string, url: unknown): void {
    var u = '' + (url == null ? '' : url);
    if (!match(u)) return;
    keep(u, 0, '');
    summary(u, 0, 0, [kind]);
  }
  function seal(obj: Record<string, unknown>, name: string, fn: unknown): void {
    try {
      Object.defineProperty(obj, name, { value: fn, writable: false, configurable: false });
    } catch (e) {
      try { obj[name] = fn; } catch (e2) {}
    }
  }
  if (!T.fetchWrapped) {
    T.fetchWrapped = true;
    try {
      var of = page.fetch as ((...a: unknown[]) => Promise<{ clone: () => { text: () => Promise<string> }; status: number }>) | undefined;
      if (of) {
        page.fetch = function () {
          var args = arguments;
          return of.apply(this, args as unknown as []).then(function (resp) {
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
    } catch (e) {}
    try {
      var XHR = page.XMLHttpRequest as typeof XMLHttpRequest;
      var oo = XHR.prototype.open, os = XHR.prototype.send;
      XHR.prototype.open = function (this: XMLHttpRequest, m: string, u: string) {
        (this as unknown as { __rtUrl?: string }).__rtUrl = u;
        return oo.apply(this, arguments as unknown as []);
      };
      XHR.prototype.send = function (this: XMLHttpRequest) {
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
    } catch (e) {}
  }
  try {
    if (page.open && !T.openWrapped) {
      T.openWrapped = true;
      var op = page.open as (...a: unknown[]) => unknown;
      seal(page, 'open', function (url: unknown) {
        try { note('open', url); } catch (e) {}
        return op.apply(page, arguments as unknown as []);
      });
    }
  } catch (e) {}
  try {
    var OW = page.WebSocket as (new (...a: unknown[]) => unknown) | undefined;
    if (OW && !T.wsWrapped) {
      T.wsWrapped = true;
      function WsWrap(this: unknown, url: unknown) {
        try { note('websocket', url); } catch (e) {}
        return Reflect.construct(OW, arguments as unknown as unknown[], new.target);
      }
      WsWrap.prototype = OW.prototype;
      seal(page, 'WebSocket', WsWrap);
    }
  } catch (e) {}
  try {
    var OE = page.EventSource as (new (...a: unknown[]) => unknown) | undefined;
    if (OE && !T.esWrapped) {
      T.esWrapped = true;
      function EsWrap(this: unknown, url: unknown) {
        try { note('eventsource', url); } catch (e) {}
        return Reflect.construct(OE, arguments as unknown as unknown[], new.target);
      }
      EsWrap.prototype = OE.prototype;
      seal(page, 'EventSource', EsWrap);
    }
  } catch (e) {}
})();
