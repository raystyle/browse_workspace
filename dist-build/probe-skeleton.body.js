"use strict";
(() => {
  // build/framework/values.ts
  var CHANNEL_BASE = {
    probeAttr: "probe",
    eventsPath: "/events"
  };
  var BASE_CAPS = {
    docElementGuard: 3e3,
    settleAwait: 2e4,
    reloadSettleAwait: 15e3,
    pageComplete: 12e3,
    transientRetryMs: 1e3,
    // 两段式(REQ-041 P0):heavy 段等 settled 信号帽 / 观察窗全程帽 / mdream 单次竞速帽
    heavySettleAwait: 2e4,
    heavyDeadline: 3e4,
    mdRaceMs: 4e3
  };

  // build/contracts.values.ts
  var CHANNEL = { ...CHANNEL_BASE, slug: "google-search" };
  var CAPS = {
    ...BASE_CAPS,
    consentReawait: 15e3,
    commitPollTick: 300,
    commitPollTries: 30,
    // 9s 提交探测
    aiStable: 1200,
    aiDeadline: 1e4,
    // follow 模式(REQ-041 P1 件2):两拍稳节拍 / 结果页内容等待硬帽 / 导航预算(1 SERP+≤N goto 跳)
    followBeat: 800,
    followDeadline: 15e3,
    followBudget: 5
  };
  var SELECTORS = {
    version: "2026-10-10.3",
    primary: "#search h3, #rso h3, div#main h3",
    fallbackScope: "#search a[href], #rso a[href], div#main a[href], main a[href]",
    gotoRe: /^https:\/\/www\.google\.com\/goto\?url=/,
    internalRe: /^(?:[a-z0-9-]+\.)*(?:google\.[a-z.]+|googleusercontent\.com|gstatic\.com|ggpht\.com|youtube\.[a-z.]+|blogger\.com|googleadservices\.com|doubleclick\.net)\//i
  };
  var TEXT_CAPS = {
    snippet: 300,
    pageText: 12e3,
    pageHtml: 16e3,
    aiText: 4e3,
    mdPage: 24e3,
    mdHtmlIn: 5e5,
    // 内容三档(REQ-041 P1 件1):snippet 档字数帽 / 要点单条长度帽 / 要点条数帽
    tierSnippet: 500,
    tierHighlight: 240,
    tierHighlights: 8
  };

  // build/probe.skeleton.ts
  var STARTED = Date.now();
  var lastMut = Date.now();
  var mo = null;
  var DBG = [];
  function dbg(ev) {
    DBG.push({ t: Date.now() - STARTED, ev: ev.slice(0, 60) });
    if (DBG.length > 24) DBG.shift();
  }
  dbg("sk:inject:" + document.readyState);
  var PORT = (() => {
    const p = "%%BROWSE_PORT%%";
    return p.indexOf("%%") === 0 ? "9880" : p;
  })();
  function unwrap(u) {
    if (u && u.indexOf("/url?") === 0) {
      try {
        return new URL(u, location.origin).searchParams.get("q") || u;
      } catch {
        return u;
      }
    }
    return u;
  }
  function judge(nResults) {
    if (document.querySelector('#consent, form[action*="consent"], div[aria-modal="true"] form[action*="consent"]')) return "consent";
    if (document.querySelector(".cf-turnstile,#challenge-running,.g-recaptcha,.h-captcha") || location.pathname.indexOf("/sorry") === 0) return "challenged";
    if (nResults === 0) return "empty";
    return "ok";
  }
  function push(out, seen, a, h, via) {
    const href = unwrap(a.href || a.getAttribute("href") || "");
    if (!/^https?:\/\//i.test(href)) return;
    const wrapped = SELECTORS.gotoRe.test(href) ? "goto" : null;
    if (!wrapped && SELECTORS.internalRe.test(href.replace(/^https?:\/\//i, ""))) return;
    if (seen[href]) return;
    seen[href] = 1;
    const cont = a.closest("div[data-hveid], div.g, div.MjjYud") || a.parentElement;
    const sn = cont ? String(cont.textContent || "").replace(/\s+/g, " ").trim().slice(0, TEXT_CAPS.snippet) : "";
    out.push({ title: String(h.textContent || "").trim(), url: href, wrapped, snippet: sn, via });
  }
  function pickMain() {
    const out = [];
    const seen = {};
    const hs = document.querySelectorAll(SELECTORS.primary);
    for (let i = 0; i < hs.length && out.length < 20; i++) {
      const a = hs[i].closest("a[href]");
      if (a) push(out, seen, a, hs[i], "main");
    }
    return out;
  }
  function pickFallback() {
    const out = [];
    const seen = {};
    const as = document.querySelectorAll(SELECTORS.fallbackScope);
    for (let i = 0; i < as.length && out.length < 20; i++) {
      const h = as[i].querySelector('h3, [role="heading"]');
      if (h) push(out, seen, as[i], h, "fallback");
    }
    return out;
  }
  function reportSettled(payload) {
    dbg("report:events");
    try {
      GM_xmlhttpRequest({
        method: "POST",
        url: "http://127.0.0.1:" + PORT + CHANNEL.eventsPath,
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({
          type: "see",
          slug: CHANNEL.slug,
          action: "read",
          url: location.href,
          data: { verdict: payload.verdict, count: payload.results.length, settled: true, urls: payload.results.map((r) => r.url) }
        }),
        onerror: () => dbg("report:error")
      });
    } catch {
      dbg("report:throw");
    }
  }
  function aiBlock() {
    const labels = ["AI Overview", "AI \u6982\u89C8", "AI \u603B\u89C8"];
    for (const label of labels) {
      const xp = document.evaluate("//text()[normalize-space(.)=" + JSON.stringify(label) + "]", document, null, 7, null);
      for (let si = 0; si < xp.snapshotLength; si++) {
        let c = xp.snapshotItem(si).parentElement;
        let guard = 0;
        while (c && guard < 8 && (c.textContent || "").length < 300) {
          c = c.parentElement;
          guard++;
        }
        if (c && (c.textContent || "").length >= 200) {
          return { container: c, text: String(c.textContent || "").replace(/\s+/g, " ").trim().slice(0, TEXT_CAPS.aiText) };
        }
      }
    }
    return null;
  }
  function aiPayload() {
    const b = aiBlock();
    return b ? { present: true, text: b.text } : { present: false, text: null };
  }
  var aiWatch = null;
  function watchAi() {
    if (aiWatch) return;
    const deadline = Date.now() + CAPS.aiDeadline;
    let pendingLen = -1;
    let pendingAt = 0;
    let aiTimer = null;
    function stopAi() {
      if (aiWatch) {
        aiWatch.disconnect();
        aiWatch = null;
      }
      if (aiTimer) {
        clearTimeout(aiTimer);
        aiTimer = null;
      }
    }
    function checkAi() {
      aiTimer = null;
      const now = Date.now();
      if (now > deadline) {
        const bc = aiBlock();
        if (bc) mergeAi(bc);
        stopAi();
        return;
      }
      const b = aiBlock();
      if (!b) return;
      const len = b.text.length;
      if (len >= 200 && len === pendingLen && now - pendingAt >= CAPS.aiStable) {
        mergeAi(b);
        stopAi();
        return;
      }
      if (len !== pendingLen) {
        pendingLen = len;
        pendingAt = now;
        dbg("ai:stream:len=" + len);
      }
      aiTimer = setTimeout(checkAi, CAPS.aiStable);
    }
    aiWatch = new MutationObserver(() => {
      if (!aiWatch) return;
      pendingLen = -1;
      if (!aiTimer) aiTimer = setTimeout(checkAi, CAPS.aiStable);
    });
    aiWatch.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    checkAi();
  }
  function mergeAi(b) {
    dbg("ai:stable:len=" + b.text.length);
    try {
      const cur = JSON.parse(document.documentElement.getAttribute(CHANNEL.probeAttr) || "null");
      if (cur && cur.slug === CHANNEL.slug) {
        cur.ai_overview = { present: true, text: b.text };
        cur.probe_debug = DBG.slice();
        document.documentElement.setAttribute(CHANNEL.probeAttr, JSON.stringify(cur));
      }
    } catch {
      dbg("ai:merge-throw");
    }
  }
  function collect(forceSettled) {
    const main = pickMain();
    const fb = main.length === 0 ? pickFallback() : [];
    const all = main.length > 0 ? main : fb;
    const verdict = judge(all.length);
    const drift = main.length === 0 && fb.length > 0 ? "suspected" : "none";
    const settled = forceSettled !== void 0 ? forceSettled : Date.now() - lastMut >= 800 || Date.now() - STARTED >= 12e3;
    const payload = {
      slug: CHANNEL.slug,
      v: SELECTORS.version,
      verdict,
      drift,
      mainHits: main.length,
      fallbackHits: fb.length,
      results: all.slice(0, 10),
      url: location.href,
      title: document.title,
      ts: Date.now(),
      settled,
      markdown: null,
      tiers: null,
      converter: verdict === "ok" ? "heavy-pending" : "skipped-" + verdict,
      ai_overview: aiPayload(),
      probe_debug: DBG.slice()
    };
    try {
      document.documentElement.setAttribute(CHANNEL.probeAttr, JSON.stringify(payload));
    } catch {
      dbg("attr:throw");
    }
    if (settled) {
      if (mo) {
        mo.disconnect();
        mo = null;
      }
      reportSettled(payload);
      if (!payload.ai_overview.present) watchAi();
    }
  }
  var lastFp = null;
  var lastFpAt = 0;
  var finalized = false;
  var iv = null;
  function disconnectAll() {
    if (iv !== null) {
      clearInterval(iv);
      iv = null;
    }
    if (mo) {
      mo.disconnect();
      mo = null;
    }
  }
  function boot() {
    mo = new MutationObserver(() => {
      lastMut = Date.now();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    iv = setInterval(() => {
      if (finalized) return;
      const now = Date.now();
      const fp = JSON.stringify(pickMain().map((r) => r.url));
      if (fp !== lastFp) {
        lastFp = fp;
        lastFpAt = now;
        collect(false);
        return;
      }
      const stable = now - lastFpAt >= 500 && JSON.parse(fp).length > 0;
      const pageDone = document.readyState === "complete" && now - lastMut >= 800;
      if (stable || pageDone || now - STARTED >= 12e3) {
        finalized = true;
        disconnectAll();
        collect(true);
      }
    }, 250);
  }
  var bootWait = setInterval(() => {
    if (document.documentElement) {
      clearInterval(bootWait);
      boot();
    }
  }, 50);
})();
