// medium-articles 探针:标签页文章卡片抽取(href 剥 source 尾参)。
// 手写单件对(不经生成器;mech.rn 内嵌同体,REV 钉版同源)。
// ==UserScript==
// @name         medium-articles probe
// @match        https://medium.com/tag/*
// @run-at       document-idle
// ==/UserScript==
(function () {
  if (window.__MediumProbe) { return; }
  window.__MediumProbe = 1;
  var REV = 'medium-articles/1';
  function collect() {
    var out = [];
    var arts = document.querySelectorAll('article');
    for (var i = 0; i < arts.length; i++) {
      var a = arts[i];
      var links = a.querySelectorAll('a[href]');
      var href = '';
      var title = '';
      var author = '';
      for (var j = 0; j < links.length; j++) {
        var h = (links[j].getAttribute('href') || '').split('?')[0];
        if (h.indexOf('/@') > 0 && h.indexOf('/@') < 3) {
          href = 'https://medium.com' + h;
          var t = (links[j].textContent || '').trim();
          if (t.length > 8 && !title) { title = t; }
        }
        if (h.startsWith('/@') && !author) { author = h.slice(1).split('/')[0]; }
      }
      if (href && title) {
        out.push({ href: href, title: title.slice(0, 120), author: author });
      }
    }
    return out;
  }
  function publish() {
    try {
      document.documentElement.setAttribute(
        'mediumProbe',
        JSON.stringify({ rev: REV, href: location.href, n: collect().length, articles: collect() })
      );
    } catch (e) {}
  }
  var root = document.body || document.documentElement;
  var mo = new MutationObserver(function () { publish(); });
  mo.observe(root, { childList: true, subtree: true });
  publish();
})();
