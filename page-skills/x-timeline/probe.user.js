// ==UserScript==
// @name         x-timeline probe
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
// 手写单件对(不经生成器;mech.rn 内嵌同体,REV 钉版同源)。
/* @detect */
function browseDetect(facts) {
  return null; // 显式 rune 道,不占用 goto 点名
}
/* @enddetect */
"use strict";
(function () {
  if (window.__xTimelineProbe) return;
  window.__xTimelineProbe = 1;
  var REV = 'x-timeline/6';
  var CAP = 80;
  function tabOf() {
    var tabs = document.querySelectorAll('[role=tab]');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('aria-selected') === 'true') return (tabs[i].innerText || '').trim();
    }
    return '';
  }
  function isLogin() {
    var path = location.pathname || '';
    return path.indexOf('/i/jf/') === 0 || path.indexOf('/i/flow/login') === 0 || path.indexOf('/login') === 0;
  }
  function collectPosts() {
    var posts = [];
    var seen = {};
    var arts = document.querySelectorAll('article');
    for (var i = 0; i < arts.length && posts.length < CAP; i++) {
      var a = arts[i];
      var id = '';
      var href = '';
      var statusLinks = a.querySelectorAll('a[href*="/status/"]');
      for (var j = 0; j < statusLinks.length; j++) {
        var h = (statusLinks[j].getAttribute('href') || '').split('?')[0];
        var m = h.match(/\/status\/(\d+)$/);
        if (m) { id = m[1]; href = h; break; }
      }
      if (!id || seen[id]) continue;
      seen[id] = 1;
      var user = href.split('/')[1] || '';
      var links = [];
      var outLinks = a.querySelectorAll('a');
      for (var q = 0; q < outLinks.length && links.length < 5; q++) {
        var m = ((outLinks[q].innerText || '').match(/https?:\/\/[^\s]+/) || [])[0] || '';
        if (!m) continue;
        var oh = m.replace(/[.,;)]+$/, '').split('?')[0];
        if (oh.indexOf('https://x.com') === 0 || oh.indexOf('https://twitter.com') === 0) continue;
        if (/^https:\/\/(t\.co|bit\.ly)\//.test(oh)) continue;
        links.push(oh);
      }
      var timeEl = a.querySelector('time');
      var time = timeEl ? (timeEl.getAttribute('datetime') || '') : '';
      var tt = a.querySelector('[data-testid=tweetText]');
      var raw = tt ? (tt.textContent || '') : '';
      var text = raw.replace(/\s+/g, ' ').trim().slice(0, 280);
      posts.push({ id: id, href: 'https://x.com' + href, user: user, text: text, time: time, links: links });
    }
    return posts;
  }
  function publish() {
    var login = isLogin();
    var posts = login ? [] : collectPosts();
    var onHome = (location.pathname || '').indexOf('/home') === 0;
    var verdict = 'idle';
    if (login) verdict = 'login';
    else if (posts.length) verdict = 'ok';
    else if (onHome) verdict = 'empty';
    var payload = {
      slug: 'x-timeline',
      rev: REV,
      verdict: verdict,
      settled: login || posts.length > 0,
      href: location.href,
      tab: tabOf(),
      arts: document.querySelectorAll('article').length,
      docSh: document.documentElement.scrollHeight,
      posts: posts,
      at: Date.now()
    };
    document.documentElement.setAttribute('probe', JSON.stringify(payload));
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = window.setTimeout(function () { timer = 0; publish(); }, 150);
  }
  publish();
  var root = document.body || document.documentElement;
  var mo = new MutationObserver(schedule);
  mo.observe(root, { childList: true, subtree: true });
})();
