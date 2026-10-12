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
    aiDeadline: 1e4
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

  // build/framework/tiers.ts
  function digestText(s, cap) {
    return String(s || "").replace(/\s+/g, " ").trim().slice(0, cap);
  }
  function extractHighlights(md, maxN, maxLen) {
    const out = [];
    for (const raw of String(md || "").split("\n")) {
      if (out.length >= maxN) break;
      const m = /^(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)(.+)$/.exec(raw.trim());
      if (m) out.push(digestText(m[1], maxLen));
    }
    return out;
  }
  function buildTiers(md, caps) {
    return {
      snippet: digestText(md, caps.snippet),
      highlights: extractHighlights(md, caps.highlights, caps.highlightLen),
      main: md
    };
  }

  // build/probe.heavy.ts
  var STARTED = Date.now();
  var DBG = [];
  function dbg(ev) {
    DBG.push({ t: Date.now() - STARTED, ev: ev.slice(0, 60) });
    if (DBG.length > 24) DBG.shift();
  }
  dbg("hv:inject:" + document.readyState);
  function getp() {
    try {
      return JSON.parse(document.documentElement.getAttribute(CHANNEL.probeAttr) || "null");
    } catch {
      return null;
    }
  }
  function patch(note, mut) {
    try {
      const cur = getp();
      if (cur && cur.slug === CHANNEL.slug) {
        mut(cur);
        cur.probe_debug = [...cur.probe_debug || [], { t: Date.now() - STARTED, ev: note.slice(0, 60) }];
        if (cur.probe_debug.length > 48) cur.probe_debug.splice(0, cur.probe_debug.length - 48);
        document.documentElement.setAttribute(CHANNEL.probeAttr, JSON.stringify(cur));
      }
    } catch {
      dbg("hv:patch-throw");
    }
  }
  function mdRace(p, ms) {
    return Promise.race([Promise.resolve(p), new Promise((_, rej) => setTimeout(() => rej(new Error("mdream-timeout")), ms))]);
  }
  async function mdConvertOnce(html, opts) {
    const w = window;
    const fn = w.mdream && w.mdream.htmlToMarkdown;
    if (!fn) return null;
    const raw = await mdRace(fn.call(w.mdream, html, opts), CAPS.mdRaceMs);
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object" && typeof raw.markdown === "string") return raw.markdown;
    return null;
  }
  async function mdConvert(html, origin) {
    const w = window;
    if (!(w.mdream && typeof w.mdream.htmlToMarkdown === "function")) return { markdown: null, converter: "failed", debug: { err: "mdream-absent" } };
    const chain = [
      { shape: "minimal", opts: { minimal: true, origin: origin || location.origin } },
      { shape: "clean", opts: { clean: true, origin: origin || location.origin } },
      { shape: "plain", opts: {} }
    ];
    for (const c of chain) {
      dbg("hv:md:run:" + c.shape);
      try {
        const md = await mdConvertOnce(html, c.opts);
        if (md && md !== "[object Object]") {
          dbg("hv:md:done:" + c.shape + ":len=" + md.length);
          return { markdown: md, converter: "mdream@2.0.1/" + c.shape };
        }
      } catch (e) {
        dbg("hv:md:err:" + c.shape);
        return { markdown: null, converter: /timeout/.test(String(e)) ? "failed(timeout)" : "failed", debug: { err: String(e).slice(0, 120) } };
      }
    }
    return { markdown: null, converter: "failed", debug: { err: "all-shapes-empty" } };
  }
  function aiContainer() {
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
        if (c && (c.textContent || "").length >= 200) return c;
      }
    }
    return null;
  }
  var mdKicked = false;
  var aiKicked = false;
  function kickSerpMd() {
    void (async () => {
      const out = await mdConvert(document.documentElement.outerHTML, location.origin);
      patch("hv:md:merged:" + out.converter, (p) => {
        p.markdown = out.markdown;
        p.converter = out.converter;
        if (out.markdown) {
          p.tiers = buildTiers(out.markdown, { snippet: TEXT_CAPS.tierSnippet, highlightLen: TEXT_CAPS.tierHighlight, highlights: TEXT_CAPS.tierHighlights });
        }
        if (out.debug) p.md_debug = out.debug;
        p.md_ts = Date.now();
      });
    })();
  }
  function kickAiMd() {
    const c = aiContainer();
    if (!c) {
      patch("hv:ai:md:container-gone", (p) => {
        if (p.ai_overview && p.ai_overview.present) {
          p.ai_overview.markdown = null;
          p.ai_overview.converter = "failed";
        }
      });
      return;
    }
    void (async () => {
      const out = await mdConvert(c.outerHTML.slice(0, TEXT_CAPS.mdHtmlIn), location.origin);
      patch("hv:ai:md:merged:" + out.converter, (p) => {
        if (p.ai_overview && p.ai_overview.present) {
          p.ai_overview.markdown = out.markdown;
          p.ai_overview.converter = out.converter;
          if (out.markdown) {
            p.ai_overview.tiers = buildTiers(out.markdown, { snippet: TEXT_CAPS.tierSnippet, highlightLen: TEXT_CAPS.tierHighlight, highlights: TEXT_CAPS.tierHighlights });
          }
        }
      });
    })();
  }
  function maybeKick(p) {
    if (!mdKicked && p.settled && p.verdict === "ok" && p.markdown === null) {
      mdKicked = true;
      dbg("hv:md:kick");
      kickSerpMd();
    }
    if (!aiKicked && p.settled && p.ai_overview && p.ai_overview.present && p.ai_overview.markdown == null) {
      aiKicked = true;
      dbg("hv:ai:md:kick");
      kickAiMd();
    }
  }
  var done = false;
  function boot() {
    const kickFromAttr = () => {
      const p = getp();
      if (p && p.slug === CHANNEL.slug) maybeKick(p);
    };
    kickFromAttr();
    const obs = new MutationObserver(() => {
      if (done) return;
      kickFromAttr();
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: [CHANNEL.probeAttr] });
    setTimeout(() => {
      const p = getp();
      if (!(p && p.settled)) {
        done = true;
        obs.disconnect();
        dbg("hv:settle-timeout");
      }
    }, CAPS.heavySettleAwait);
    setTimeout(() => {
      done = true;
      obs.disconnect();
    }, CAPS.heavyDeadline);
  }
  var bootWait = setInterval(() => {
    if (document.documentElement) {
      clearInterval(bootWait);
      boot();
    }
  }, 50);
  setTimeout(() => clearInterval(bootWait), CAPS.docElementGuard);
})();
