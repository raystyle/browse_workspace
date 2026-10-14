// probe.skeleton.ts — 骨架段(KB 级,document-start):指纹采样 + 收齐引擎 + attr 通道 + 事件上报。
// 重库(mdream/重提取器)禁入本段(gr01-R3:331KB WASM 在 document-start 全量解析是注入面浪费)——
// 归 heavy 段(probe.heavy.ts,settled 后按需初始化)。
import { CAPS, CHANNEL, SELECTORS, TEXT_CAPS } from './contracts.values.ts';

declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;

const STARTED = Date.now();
let lastMut = Date.now();
let mo: MutationObserver | null = null;
const DBG: { t: number; ev: string }[] = [];
function dbg(ev: string): void {
  DBG.push({ t: Date.now() - STARTED, ev: ev.slice(0, 60) });
  if (DBG.length > 24) DBG.shift();
}
dbg('sk:inject:' + document.readyState);

const PORT = (() => {
  const p = '%%BROWSE_PORT%%';
  return p.indexOf('%%') === 0 ? '9880' : p;
})();

function unwrap(u: string): string {
  if (u && u.indexOf('/url?') === 0) {
    try {
      return new URL(u, location.origin).searchParams.get('q') || u;
    } catch {
      return u;
    }
  }
  return u;
}

function judge(nResults: number): 'consent' | 'challenged' | 'empty' | 'ok' {
  if (document.querySelector('#consent, form[action*="consent"], div[aria-modal="true"] form[action*="consent"]')) return 'consent';
  if (document.querySelector('.cf-turnstile,#challenge-running,.g-recaptcha,.h-captcha') || location.pathname.indexOf('/sorry') === 0) return 'challenged';
  if (nResults === 0) return 'empty';
  return 'ok';
}

type Picked = { title: string; url: string; wrapped: 'goto' | null; snippet: string; via: 'main' | 'fallback' };

function push(out: Picked[], seen: Record<string, 1>, a: HTMLAnchorElement, h: Element, via: 'main' | 'fallback'): void {
  const href = unwrap(a.href || a.getAttribute('href') || '');
  if (!/^https?:\/\//i.test(href)) return;
  const wrapped: 'goto' | null = SELECTORS.gotoRe.test(href) ? 'goto' : null;
  if (!wrapped && SELECTORS.internalRe.test(href.replace(/^https?:\/\//i, ''))) return;
  if (seen[href]) return;
  seen[href] = 1;
  const cont = a.closest('div[data-hveid], div.g, div.MjjYud') || a.parentElement;
  const sn = cont ? String(cont.textContent || '').replace(/\s+/g, ' ').trim().slice(0, TEXT_CAPS.snippet) : '';
  out.push({ title: String(h.textContent || '').trim(), url: href, wrapped, snippet: sn, via });
}

function pickMain(): Picked[] {
  const out: Picked[] = [];
  const seen: Record<string, 1> = {};
  const hs = document.querySelectorAll(SELECTORS.primary);
  for (let i = 0; i < hs.length && out.length < 20; i++) {
    const a = hs[i].closest('a[href]');
    if (a) push(out, seen, a as HTMLAnchorElement, hs[i], 'main');
  }
  return out;
}

function pickFallback(): Picked[] {
  const out: Picked[] = [];
  const seen: Record<string, 1> = {};
  const as = document.querySelectorAll(SELECTORS.fallbackScope);
  for (let i = 0; i < as.length && out.length < 20; i++) {
    const h = as[i].querySelector('h3, [role="heading"]');
    if (h) push(out, seen, as[i] as HTMLAnchorElement, h, 'fallback');
  }
  return out;
}

function reportSettled(payload: { verdict: string; results: { url: string }[] }): void {
  dbg('report:events');
  try {
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'http://127.0.0.1:' + PORT + CHANNEL.eventsPath,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        type: 'see', slug: CHANNEL.slug, action: 'read', url: location.href,
        data: { verdict: payload.verdict, count: payload.results.length, settled: true, urls: payload.results.map((r) => r.url) },
      }),
      onerror: () => dbg('report:error'),
    });
  } catch {
    dbg('report:throw');
  }
}

// AI Overview 文本面(轻 DOM;markdown 富集归 heavy 段)
function aiBlock(): { container: Element; text: string } | null {
  const labels = ['AI Overview', 'AI 概览', 'AI 总览'];
  for (const label of labels) {
    const xp = document.evaluate('//text()[normalize-space(.)=' + JSON.stringify(label) + ']', document, null, 7, null);
    for (let si = 0; si < xp.snapshotLength; si++) {
      let c: Element | null = xp.snapshotItem(si).parentElement;
      let guard = 0;
      while (c && guard < 8 && (c.textContent || '').length < 300) { c = c.parentElement; guard++; }
      if (c && (c.textContent || '').length >= 200) {
        return { container: c, text: String(c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, TEXT_CAPS.aiText) };
      }
    }
  }
  return null;
}
function aiPayload(): { present: boolean; text: string | null } {
  const b = aiBlock();
  return b ? { present: true, text: b.text } : { present: false, text: null };
}
let aiWatch: MutationObserver | null = null;
function watchAi(): void {
  if (aiWatch) return;
  const deadline = Date.now() + CAPS.aiDeadline;
  let pendingLen = -1;
  let pendingAt = 0;
  let aiTimer: ReturnType<typeof setTimeout> | null = null;
  function stopAi(): void {
    if (aiWatch) { aiWatch.disconnect(); aiWatch = null; }
    if (aiTimer) { clearTimeout(aiTimer); aiTimer = null; }
  }
  function checkAi(): void {
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
    if (len >= 200 && len === pendingLen && now - pendingAt >= CAPS.aiStable) { mergeAi(b); stopAi(); return; }
    if (len !== pendingLen) { pendingLen = len; pendingAt = now; dbg('ai:stream:len=' + len); }
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
function mergeAi(b: { text: string }): void {
  dbg('ai:stable:len=' + b.text.length);
  try {
    const cur = JSON.parse(document.documentElement.getAttribute(CHANNEL.probeAttr) || 'null');
    if (cur && cur.slug === CHANNEL.slug) {
      cur.ai_overview = { present: true, text: b.text };
      cur.probe_debug = DBG.slice();
      document.documentElement.setAttribute(CHANNEL.probeAttr, JSON.stringify(cur));
    }
  } catch {
    dbg('ai:merge-throw');
  }
}

function collect(forceSettled?: boolean): void {
  const main = pickMain();
  const fb = main.length === 0 ? pickFallback() : [];
  const all = main.length > 0 ? main : fb;
  const verdict = judge(all.length);
  const drift = main.length === 0 && fb.length > 0 ? 'suspected' : 'none';
  const settled = forceSettled !== undefined ? forceSettled : Date.now() - lastMut >= 800 || Date.now() - STARTED >= 12000;
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
    converter: verdict === 'ok' ? 'heavy-pending' : 'skipped-' + verdict,
    ai_overview: aiPayload(),
    probe_debug: DBG.slice(),
  };
  try {
    document.documentElement.setAttribute(CHANNEL.probeAttr, JSON.stringify(payload));
  } catch {
    dbg('attr:throw');
  }
  if (settled) {
    if (mo) { mo.disconnect(); mo = null; }
    reportSettled(payload);
    if (!payload.ai_overview.present) watchAi();
  }
}

let lastFp: string | null = null;
let lastFpAt = 0;
let finalized = false;
let iv: ReturnType<typeof setInterval> | null = null;
function disconnectAll(): void {
  if (iv !== null) { clearInterval(iv); iv = null; }
  if (mo) { mo.disconnect(); mo = null; }
}
function boot(): void {
  mo = new MutationObserver(() => { lastMut = Date.now(); });
  mo.observe(document.documentElement, { childList: true, subtree: true });
  iv = setInterval(() => {
    if (finalized) return;
    const now = Date.now();
    const fp = JSON.stringify(pickMain().map((r) => r.url));
    if (fp !== lastFp) {
      lastFp = fp; lastFpAt = now;
      collect(false);
      return;
    }
    const stable = now - lastFpAt >= 500 && JSON.parse(fp).length > 0;
    const pageDone = document.readyState === 'complete' && now - lastMut >= 800;
    if (stable || pageDone || now - STARTED >= 12000) {
      finalized = true;
      disconnectAll();
      collect(true);
    }
  }, 250);
}
const bootWait: ReturnType<typeof setInterval> = setInterval(() => {
  if (document.documentElement) {
    clearInterval(bootWait);
    boot();
  }
}, 50);
