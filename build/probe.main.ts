// probe.main.ts — google-search probe 本体(TS 源,esbuild 出 IIFE 进 probe.user.js)
// 运行环境:clean-chrome 油猴世界(GM_xmlhttpRequest 可用,不吃页面 CSP)。
// 三要素:事件驱动(observer/指纹稳定)、原子错误(终态如实,converter 记失败形)、超时兜底(CAPS)。
import { CAPS, CHANNEL, SELECTORS, TEXT_CAPS } from './contracts';

declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;

const STARTED = Date.now();
let lastMut = Date.now();
let mo: MutationObserver | null = null;
const DBG: { t: number; ev: string }[] = [];
function dbg(ev: string): void {
  DBG.push({ t: Date.now() - STARTED, ev: ev.slice(0, 60) });
  if (DBG.length > 24) DBG.shift();
}
dbg('inject:readyState=' + document.readyState);

// %%BROWSE_PORT%% 由 browse userscript install 时替换(守 127.0.0.1 上报道)
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
  // /goto?url= 是 SERP 结果包装(服务端跟跳),不是内链:放行并打标
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

// 完成回调:报 daemon /events 一次(携完整 url 列表)
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

// md 公共执行器:mdream IIFE 实测回 Promise 且 d.ts 声 string 不可信;竞速帽防挂死。
// 降级链 minimal(isolateMain 对 SERP 常取空)-> clean -> plain。
function mdRace<T>(p: T, ms: number): Promise<T> {
  return Promise.race([Promise.resolve(p), new Promise<never>((_, rej) => setTimeout(() => rej(new Error('mdream-timeout')), ms))]);
}
async function mdConvertOnce(html: string, opts: Record<string, unknown>): Promise<string | null> {
  const w = window as unknown as { mdream?: { htmlToMarkdown?: (h: string, o?: Record<string, unknown>) => Promise<string> | string } };
  const fn = w.mdream && w.mdream.htmlToMarkdown;
  if (!fn) return null;
  const raw = await mdRace(fn.call(w.mdream, html, opts), 4000);
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object' && typeof (raw as { markdown?: string }).markdown === 'string') return (raw as { markdown: string }).markdown;
  return null;
}
async function mdConvert(html: string, origin?: string): Promise<{ markdown: string | null; converter: string; debug?: { err: string } }> {
  const w = window as unknown as { mdream?: { htmlToMarkdown?: unknown } };
  if (!(w.mdream && typeof w.mdream.htmlToMarkdown === 'function')) return { markdown: null, converter: 'failed', debug: { err: 'mdream-absent' } };
  const chain: { shape: string; opts: Record<string, unknown> }[] = [
    { shape: 'minimal', opts: { minimal: true, origin: origin || location.origin } },
    { shape: 'clean', opts: { clean: true, origin: origin || location.origin } },
    { shape: 'plain', opts: {} },
  ];
  for (const c of chain) {
    dbg('md:run:' + c.shape);
    try {
      const md = await mdConvertOnce(html, c.opts);
      if (md && md !== '[object Object]') {
        dbg('md:done:' + c.shape + ':len=' + md.length);
        return { markdown: md, converter: 'mdream@2.0.1/' + c.shape };
      }
    } catch (e) {
      dbg('md:err:' + c.shape);
      return { markdown: null, converter: /timeout/.test(String(e)) ? 'failed(timeout)' : 'failed', debug: { err: String(e).slice(0, 120) } };
    }
  }
  return { markdown: null, converter: 'failed', debug: { err: 'all-shapes-empty' } };
}

// AI Overview 采集:流式晚到,事件道(变更重置待稳,两拍稳即收;deadline 帽)
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
function mergeAi(b: { container: Element; text: string }): void {
  dbg('ai:stable:len=' + b.text.length);
  try {
    const cur = JSON.parse(document.documentElement.getAttribute(CHANNEL.probeAttr) || 'null');
    if (cur && cur.slug === CHANNEL.slug) {
      cur.ai_overview = { present: true, text: b.text };
      cur.probe_debug = DBG.slice();
      document.documentElement.setAttribute(CHANNEL.probeAttr, JSON.stringify(cur));
      void (async () => {
        try {
          const c = await mdConvert(b.container.outerHTML.slice(0, 200000), location.origin);
          const cur2 = JSON.parse(document.documentElement.getAttribute(CHANNEL.probeAttr) || 'null');
          if (cur2 && cur2.ai_overview && cur2.ai_overview.present) {
            cur2.ai_overview.markdown = c.markdown;
            cur2.ai_overview.converter = c.converter;
            document.documentElement.setAttribute(CHANNEL.probeAttr, JSON.stringify(cur2));
            dbg('ai:md-done');
          }
        } catch {
          dbg('ai:md-err');
        }
      })();
    }
  } catch {
    dbg('ai:merge-throw');
  }
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

// SERP 摘要异步补写:settled 终写不等待 mdream,不卡收齐信号
let mdKicked = false;
function enrichMd(): void {
  if (mdKicked) return;
  mdKicked = true;
  dbg('md:kick');
  void (async () => {
    const out = await mdConvert(document.documentElement.outerHTML, location.origin);
    try {
      const cur = JSON.parse(document.documentElement.getAttribute(CHANNEL.probeAttr) || 'null');
      if (cur && cur.slug === CHANNEL.slug) {
        cur.markdown = out.markdown;
        cur.converter = out.converter;
        if (out.debug) cur.md_debug = out.debug;
        cur.md_ts = Date.now();
        cur.probe_debug = DBG.slice();
        document.documentElement.setAttribute(CHANNEL.probeAttr, JSON.stringify(cur));
        dbg('md:merged');
      }
    } catch {
      dbg('md:merge-throw');
    }
  })();
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
    converter: verdict === 'ok' ? 'mdream-pending' : 'skipped-' + verdict,
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
    enrichMd();
    if (!payload.ai_overview.present) watchAi();
  }
}

// 收集期(document-start 早注入;interval 驱动,变更只记时不排程——SERP 动画变更流
// 会饿死去抖排程)。链接在页即出 attr;收齐 = 指纹稳定(两拍不变)或页面完成静默或 12s 帽。
let lastFp: string | null = null;
let lastFpAt = 0;
let finalized = false;
let iv: ReturnType<typeof setInterval> | null = null;
function disconnectAll(): void {
  if (iv !== null) { clearInterval(iv); iv = null; }
  if (mo) { mo.disconnect(); mo = null; }
}
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
