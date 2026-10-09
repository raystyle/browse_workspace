// _prelude.js — 判定 facts 游走（清仓重写版；browse 拼批时在各 @detect 块前执行）
// 契约：往 facts 上写字段；可写 facts.framework = {name, version}（info 字段）。
// 纪律：一次有界 DOM 走访（TreeWalker 前 800 封顶）、不用 getComputedStyle、
// 不改 DOM 不发请求。多对共存的钩子单包约定也在此（browseTapWrap）。
try {
  var w = window, d = w.document;
  if (!d || !d.body) throw 0;

  // 框架识别（info 字段）
  var fname = null, fver = null;
  if (w.__vue_app__) { fname = 'vue'; fver = w.__vue_app__.version || null; }
  else if (w.Ember && w.Ember.VERSION) { fname = 'ember'; fver = w.Ember.VERSION; }
  else if (d.querySelector('astro-island')) { fname = 'astro'; }
  else if (d.querySelector('[q\\:container]')) { fname = 'qwik'; }
  facts.hydrationGlobals = !!(w.__NEXT_DATA__ || w.__NUXT_DATA__ || Array.isArray(w.__next_f));

  // 挑战/反爬特征（challenge-stop / antibot-vendor 的 facts 腿）
  facts.hasTurnstile = !!d.querySelector('.cf-turnstile');
  facts.hasChallengeDom = !!d.querySelector('#challenge-running,.cf-chl-running,#challenge-form');
  facts.hasCaptchaWidget = !!d.querySelector('.g-recaptcha,.h-captcha,[data-sitekey]');
  var ck = '';
  try { ck = d.cookie || ''; } catch (e) {}
  facts.cfCookie = /(?:^|;\s*)(?:cf_clearance|__cf_bm)=/.test(ck);
  facts.akamaiCookie = /(?:^|;\s*)(?:_abck|ak_bmsc|bm_sz)=/.test(ck);

  // 反爬产品脚本特征（按已知 URL 片段；只记在否）
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

  // 列表/滚动/翻页特征（采集对的判定腿）
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

  // CSP meta（policy-surface 腿；响应头归 mech.rn 走 CDP）
  facts.cspMeta = !!d.querySelector('meta[http-equiv="Content-Security-Policy"]');

  // 有界游走（框架 expando 补腿）
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

// 钩子单包约定：多对共存时 fetch/history 只包一层，各对登记自己的过滤器。
// 用法：var tap = browseTapWrap('my-slug', fetch, function(args){...}) —— 返回
// 已守卫的包装函数；后装的对拿到的已是包装函数，只追加过滤器不再包。
window.__browseTap = window.__browseTap || {};
