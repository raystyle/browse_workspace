// ==UserScript==
// @name         x-people probe
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
// 手写单件对(x-people);mech.rn 内嵌同体,REV 钉版同源。人员主页 bio 观察面。
/* @detect */
function browseDetect(facts) {
  return null; // 显式 rune 道,不占用 goto 点名
}
/* @enddetect */
"use strict";
(function () {
  if (window.__xPeopleProbe) return;
  window.__xPeopleProbe = 1;
  var REV = 'x-people/1';
  function profileHandle() {
    var p = (location.pathname || '').split('/');
    return p.length > 1 && p[1] && p[1].indexOf('/') === -1 ? p[1] : '';
  }
  function collect() {
    var n = document.querySelector('div[data-testid=UserName]');
    var b = document.querySelector('div[data-testid=UserDescription]');
    var fl = document.querySelector('a[href$="/verified_followers"], a[href$="/followers"]');
    return {
      handle: profileHandle(),
      name: n ? (n.innerText || '').split('\n')[0].trim() : null,
      bio: b ? (b.innerText || '').trim().slice(0, 300) : null,
      followers: fl ? (fl.innerText || '').trim().split('\n')[0] : null
    };
  }
  function publish() {
    var c = collect();
    var settled = !!(c.name || c.bio) || (location.pathname || '') === '/';
    var payload = { slug: 'x-people', rev: REV, settled: settled, href: location.href, c: c, at: Date.now() };
    document.documentElement.setAttribute('probe-x-people', JSON.stringify(payload));
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
