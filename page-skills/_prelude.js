// _prelude.js — 判定 facts 游走 + 探针运行时骨架(probe-kit v1)
// 双职责(总台令 2026-10-09「庞大的油猴探针框架」起步件):
//   1) 判定 facts:browse 拼批时在各 @detect 块前执行(往 facts 写字段,
//      可写 facts.framework = {name, version})
//   2) 探针运行时:常驻腿共享 window.__probe 命名空间(reporter/钩子
//      注册表/节流去重/端口发现/错误隔离)——各 probe.user.js 的 IIFE
//      里用,坏一个探针不掉全局
// 纪律:一次有界 DOM 走访(前 800 封顶)、不用 getComputedStyle、
// 判定段不改 DOM 不发请求。

// ---------- 探针运行时(常驻腿用;判定段不触) ----------
window.__probe = window.__probe || (function () {
  var PORT = (function () {
    var p = '%%BROWSE_PORT%%';
    return (p.indexOf('%%') === 0) ? '9880' : p;
  })();
  var BASE = 'http://127.0.0.1:' + PORT;
  var R = {
    port: PORT,
    base: BASE,
    // 已上报去重键(同页生命周期同键只报一次)
    _seen: {},
    // 节流表
    _last: {}
  };

  // 上报一条观察事件(P0 收口:探针只发动作枚举,cta 句子由 daemon 模板
  // 生成——页面可控侧不得供命令文本,grok 安全评审 2026-10-10)
  // opts: {slug, action('read'|'rune'|'export'), data, once(去重键), throttleMs}
  R.see = function (opts) {
    try {
      if (opts.once) {
        if (R._seen[opts.once]) return false;
        R._seen[opts.once] = 1;
      }
      if (opts.throttleMs) {
        var now = Date.now();
        if (R._last[opts.once || opts.slug] && now - R._last[opts.once || opts.slug] < opts.throttleMs) return false;
        R._last[opts.once || opts.slug] = now;
      }
      var body = {
        type: 'see',
        slug: opts.slug || null,
        url: location.href,
        data: opts.data || null,
        action: opts.action || null
      };
      R._post('/events', body);
      return true;
    } catch (e) { return false; }
  };

  // 条件停止(打断在飞的 mech.rn;回执带 capture)
  R.stop = function (slug, data) {
    try {
      R._post('/userscript/stop', { slug: slug, url: location.href, data: data || {} });
      return true;
    } catch (e) { return false; }
  };

  R._post = function (path, body) {
    if (typeof GM_xmlhttpRequest !== 'function') return; // 未装/无 grant 时静默
    GM_xmlhttpRequest({
      method: 'POST',
      url: R.base + path,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(body),
      onerror: function () { /* daemon 不在:静默 */ }
    });
  };

  // 钩子注册表:单包约定(Symbol 锚),多探针共存各自登记过滤器
  // 用法:R.tap('my-slug', function(ctx){ ctx.url/.method/.respond(text,status) })
  R._taps = [];
  R.tap = function (name, fn) {
    R._taps.push({ name: name, fn: fn });
    R._installTaps();
  };
  R._installTaps = function () {
    if (R._tapsInstalled) return;
    R._tapsInstalled = true;
    try {
      var of = window.fetch;
      if (of) {
        window.fetch = function () {
          var args = arguments;
          return of.apply(this, args).then(function (resp) {
            try {
              var u = '' + (args[0] && args[0].url || args[0]);
              var c = resp.clone();
              c.text().then(function (tx) {
                R._taps.forEach(function (t) {
                  try { t.fn({ url: u, body: tx, status: resp.status, kind: 'fetch' }); } catch (e) {}
                });
              }).catch(function () {});
            } catch (e) {}
            return resp;
          });
        };
      }
      var oo = XMLHttpRequest.prototype.open, os = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = function (m, u) { this.__probeUrl = u; return oo.apply(this, arguments); };
      XMLHttpRequest.prototype.send = function () {
        var x = this;
        x.addEventListener('load', function () {
          try {
            var tx = x.responseType === 'json' ? JSON.stringify(x.response) : ('' + (x.responseText || ''));
            R._taps.forEach(function (t) {
              try { t.fn({ url: '' + x.__probeUrl, body: tx, status: x.status, kind: 'xhr' }); } catch (e) {}
            });
          } catch (e) {}
        });
        return os.apply(this, arguments);
      };
    } catch (e) {}
  };

  // history 单包(路由观察)
  R.route = function (fn) {
    try {
      if (!history.__probeWrapped) {
        var wp = history.pushState.bind(history);
        var wr = history.replaceState.bind(history);
        history.pushState = function () { var r = wp.apply(history, arguments); try { fn({ kind: 'pushState' }); } catch (e) {} return r; };
        history.replaceState = function () { var r = wr.apply(history, arguments); try { fn({ kind: 'replaceState' }); } catch (e) {} return r; };
        Object.defineProperty(history, '__probeWrapped', { value: true });
      }
      window.addEventListener('popstate', function () { try { fn({ kind: 'popstate' }); } catch (e) {} });
      window.addEventListener('hashchange', function () { try { fn({ kind: 'hashchange' }); } catch (e) {} });
    } catch (e) {}
  };

  // 页面收尾 flush(beforeunload 前 last-chance)
  R.onFlush = function (fn) {
    window.addEventListener('beforeunload', function () { try { fn(); } catch (e) {} });
  };

  return R;
})();

// ---------- 判定 facts(browse 拼批执行段) ----------
var facts = (typeof facts !== 'undefined') ? facts : {};
try {
  var w = window, d = w.document;
  if (!d || !d.body) throw 0;

  var fname = null, fver = null;
  if (w.__vue_app__) { fname = 'vue'; fver = w.__vue_app__.version || null; }
  else if (w.Ember && w.Ember.VERSION) { fname = 'ember'; fver = w.Ember.VERSION; }
  else if (d.querySelector('astro-island')) { fname = 'astro'; }
  else if (d.querySelector('[q\\:container]')) { fname = 'qwik'; }
  facts.hydrationGlobals = !!(w.__NEXT_DATA__ || w.__NUXT_DATA__ || Array.isArray(w.__next_f));

  facts.hasTurnstile = !!d.querySelector('.cf-turnstile');
  facts.hasChallengeDom = !!d.querySelector('#challenge-running,.cf-chl-running,#challenge-form');
  facts.hasCaptchaWidget = !!d.querySelector('.g-recaptcha,.h-captcha,[data-sitekey]');
  var ck = '';
  try { ck = d.cookie || ''; } catch (e) {}
  facts.cfCookie = /(?:^|;\s*)(?:cf_clearance|__cf_bm)=/.test(ck);
  facts.akamaiCookie = /(?:^|;\s*)(?:_abck|ak_bmsc|bm_sz)=/.test(ck);

  var scripts = d.querySelectorAll('script[src]');
  var sCap = Math.min(scripts.length, 60), sv = [];
  for (var i = 0; i < sCap; i++) sv.push(scripts[i].src || '');
  facts.scriptVendor = {
    cloudflare: sv.some(function (u) { return u.indexOf('challenges.cloudflare.com') >= 0; }),
    recaptcha: sv.some(function (u) { return u.indexOf('recaptcha') >= 0; }),
    hcaptcha: sv.some(function (u) { return u.indexOf('hcaptcha.com') >= 0; }),
    akamai: sv.some(function (u) { return u.indexOf('akamai') >= 0; }),
    datadome: sv.some(function (u) { return u.indexOf('datadome') >= 0; }),
    imperva: sv.some(function (u) { return u.indexOf('imperva') >= 0 || u.indexOf('incapsula') >= 0; })
  };

  facts.hasRelNext = !!d.querySelector('a[rel=next],[rel="next"],[aria-label="Next"],a[aria-label="next"]');
  facts.docHeight = Math.max(d.documentElement ? d.documentElement.scrollHeight : 0, d.body.scrollHeight);
  facts.viewportHeight = w.innerHeight || 0;
  facts.passwordVisible = (function () {
    var pws = d.querySelectorAll('input[type=password]');
    var cap = Math.min(pws.length, 10);
    for (var j = 0; j < cap; j++) {
      try { if (pws[j].getClientRects().length > 0) return true; } catch (e) { return true; }
    }
    return false;
  })();

  facts.cspMeta = !!d.querySelector('meta[http-equiv="Content-Security-Policy"]');

  var CAP = 800, n = 0, react = false, svelte = false, angular = null;
  var tw = d.createTreeWalker(d, NodeFilter.SHOW_ELEMENT, null);
  var el;
  while (n < CAP && (el = tw.nextNode())) {
    n++;
    if (!(react && svelte)) {
      var keys = Object.getOwnPropertyNames(el);
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (!react && (key.lastIndexOf('__reactContainer$', 0) === 0 || key.lastIndexOf('__reactFiber$', 0) === 0)) react = true;
        else if (!svelte && key.lastIndexOf('__svelte', 0) === 0) svelte = true;
        if (react && svelte) break;
      }
    }
    if (angular === null && el.tagName === 'BODY' && el.getAttribute) {
      var av = el.getAttribute('ng-version');
      if (av) angular = av;
    }
  }
  if (angular !== null) { fname = 'angular'; fver = angular; }
  if (react) { fname = 'react'; fver = null; }
  else if (svelte && fname === null) { fname = 'svelte'; fver = null; }
  if (fname) facts.framework = { name: fname, version: fver };
} catch (e) { /* facts 尽力而为 */ }
