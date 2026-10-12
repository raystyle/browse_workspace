// probe.heavy.ts — 重段本体(TS 源,esbuild 出 IIFE 进 probe.heavy.user.js,组装序:头+vendored mdream+体)
// 运行环境:clean-chrome 油猴世界(document-idle;vendor IIFE 先于本体检,window.mdream 已在)。
// 职责(REQ-041 P0 / gr01-R3;P1 件1 三档):settled 信号触发后 SERP md + AI overview md 富集
// 成三档 {snippet ≤500 字摘要, highlights 要点, main 全文 md},写回同一 probe attr。
// 三要素:事件驱动(attr MutationObserver 等 settle/present,不轮询)、原子错误(converter 如实记
// 失败形,不假绿)、超时兜底(heavySettleAwait/heavyDeadline/mdRaceMs 帽,contracts CAPS 唯一权威)。
// 纪律:不判 verdict 不造假——skeleton 是唯一判读方;骨架缺席/未收齐即静默退出,attr 保持原样。
import { CAPS, CHANNEL, TEXT_CAPS } from './contracts.values.ts';
import type { SettleSignal } from './framework/values.ts';
import { buildTiers } from './framework/tiers.ts';

const STARTED = Date.now();
const DBG: { t: number; ev: string }[] = [];
function dbg(ev: string): void {
  DBG.push({ t: Date.now() - STARTED, ev: ev.slice(0, 60) });
  if (DBG.length > 24) DBG.shift();
}
dbg('hv:inject:' + document.readyState);

// 内容三档形(REQ-041 P1 件1;值面构造走 framework/tiers.ts buildTiers)
type Tiers = { snippet: string; highlights: string[]; main: string };

// attr 面(skeleton 终写形 + heavy 富集字段)
type Payload = SettleSignal & {
  markdown: string | null;
  tiers: Tiers | null;
  converter: string;
  ai_overview: { present: boolean; text: string | null; markdown?: string | null; converter?: string | null; tiers?: Tiers | null } | null;
  probe_debug?: { t: number; ev: string }[];
};

function getp(): Payload | null {
  try {
    return JSON.parse(document.documentElement.getAttribute(CHANNEL.probeAttr) || 'null') as Payload | null;
  } catch {
    return null;
  }
}

// 写回:同一同步块内读-改-写(与 skeleton 的 mergeAi 互不丢写;跨 tick 无交错窗口)
function patch(note: string, mut: (p: Payload) => void): void {
  try {
    const cur = getp();
    if (cur && cur.slug === CHANNEL.slug) {
      mut(cur);
      cur.probe_debug = [...(cur.probe_debug || []), { t: Date.now() - STARTED, ev: note.slice(0, 60) }];
      if (cur.probe_debug.length > 48) cur.probe_debug.splice(0, cur.probe_debug.length - 48);
      document.documentElement.setAttribute(CHANNEL.probeAttr, JSON.stringify(cur));
    }
  } catch {
    dbg('hv:patch-throw');
  }
}

// md 公共执行器:mdream IIFE 实测回 Promise 且 d.ts 声 string 不可信;竞速帽防挂死。
// 降级链 minimal(isolateMain 对 SERP 常取空)-> clean -> plain(沿旧单体 probe.main 形)。
function mdRace<T>(p: T, ms: number): Promise<T> {
  return Promise.race([Promise.resolve(p), new Promise<never>((_, rej) => setTimeout(() => rej(new Error('mdream-timeout')), ms))]);
}
async function mdConvertOnce(html: string, opts: Record<string, unknown>): Promise<string | null> {
  const w = window as unknown as { mdream?: { htmlToMarkdown?: (h: string, o?: Record<string, unknown>) => Promise<string> | string } };
  const fn = w.mdream && w.mdream.htmlToMarkdown;
  if (!fn) return null;
  const raw = await mdRace(fn.call(w.mdream, html, opts), CAPS.mdRaceMs);
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
    dbg('hv:md:run:' + c.shape);
    try {
      const md = await mdConvertOnce(html, c.opts);
      if (md && md !== '[object Object]') {
        dbg('hv:md:done:' + c.shape + ':len=' + md.length);
        return { markdown: md, converter: 'mdream@2.0.1/' + c.shape };
      }
    } catch (e) {
      dbg('hv:md:err:' + c.shape);
      return { markdown: null, converter: /timeout/.test(String(e)) ? 'failed(timeout)' : 'failed', debug: { err: String(e).slice(0, 120) } };
    }
  }
  return { markdown: null, converter: 'failed', debug: { err: 'all-shapes-empty' } };
}

// AI Overview 块定位(与 skeleton aiBlock 同形:text 标签上溯到 ≥300 字容器)
function aiContainer(): Element | null {
  const labels = ['AI Overview', 'AI 概览', 'AI 总览'];
  for (const label of labels) {
    const xp = document.evaluate('//text()[normalize-space(.)=' + JSON.stringify(label) + ']', document, null, 7, null);
    for (let si = 0; si < xp.snapshotLength; si++) {
      let c: Element | null = xp.snapshotItem(si).parentElement;
      let guard = 0;
      while (c && guard < 8 && (c.textContent || '').length < 300) { c = c.parentElement; guard++; }
      if (c && (c.textContent || '').length >= 200) return c;
    }
  }
  return null;
}

// 富集两腿:SERP md(仅 verdict=ok;非 ok 保 'skipped-*' 不假绿)+ AI md(present 即做,失败形如实)
let mdKicked = false;
let aiKicked = false;
function kickSerpMd(): void {
  void (async () => {
    const out = await mdConvert(document.documentElement.outerHTML, location.origin);
    patch('hv:md:merged:' + out.converter, (p) => {
      p.markdown = out.markdown;
      p.converter = out.converter;
      // 三档富集(REQ-041 P1 件1):md 成功才有 tiers;失败形保持 null 如实
      if (out.markdown) {
        p.tiers = buildTiers(out.markdown, { snippet: TEXT_CAPS.tierSnippet, highlightLen: TEXT_CAPS.tierHighlight, highlights: TEXT_CAPS.tierHighlights });
      }
      if (out.debug) (p as { md_debug?: { err: string } }).md_debug = out.debug;
      (p as { md_ts?: number }).md_ts = Date.now();
    });
  })();
}
function kickAiMd(): void {
  const c = aiContainer();
  if (!c) {
    patch('hv:ai:md:container-gone', (p) => {
      if (p.ai_overview && p.ai_overview.present) { p.ai_overview.markdown = null; p.ai_overview.converter = 'failed'; }
    });
    return;
  }
  void (async () => {
    const out = await mdConvert(c.outerHTML.slice(0, TEXT_CAPS.mdHtmlIn), location.origin);
    patch('hv:ai:md:merged:' + out.converter, (p) => {
      if (p.ai_overview && p.ai_overview.present) {
        p.ai_overview.markdown = out.markdown;
        p.ai_overview.converter = out.converter;
        // 三档富集(REQ-041 P1 件1):AI 块 md 同形(AI 分析块多列表结构,要点档常有实货)
        if (out.markdown) {
          p.ai_overview.tiers = buildTiers(out.markdown, { snippet: TEXT_CAPS.tierSnippet, highlightLen: TEXT_CAPS.tierHighlight, highlights: TEXT_CAPS.tierHighlights });
        }
      }
    });
  })();
}
function maybeKick(p: Payload): void {
  // 两腿都严格等 settled:终写前 skeleton 会整包重建 payload(丢富集字段),且
  // 引擎晚批注入时首写即带 present:true(页面已 complete)——未 settle 就锁腿 = 永失
  if (!mdKicked && p.settled && p.verdict === 'ok' && p.markdown === null) { mdKicked = true; dbg('hv:md:kick'); kickSerpMd(); }
  if (!aiKicked && p.settled && p.ai_overview && p.ai_overview.present && p.ai_overview.markdown == null) { aiKicked = true; dbg('hv:ai:md:kick'); kickAiMd(); }
}

// 编排:等 settle 信号(事件道观察 attr;两段帽——未收齐帽撤观察,全程帽收观察窗)。
// 骨架缺席不弃:引擎脚本清单应答晚到时 start/idle 两桶同批注入(clean-chrome OnScripts 实测形),
// heavy 可能先于 skeleton 首写 attr 启动——observer 兜住 attr 首现,有界等(heavySettleAwait)。
let done = false;
function boot(): void {
  const kickFromAttr = (): void => {
    const p = getp();
    if (p && p.slug === CHANNEL.slug) maybeKick(p);
  };
  kickFromAttr();
  const obs = new MutationObserver(() => {
    if (done) return;
    kickFromAttr();
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: [CHANNEL.probeAttr] });
  // 帽1:heavySettleAwait 内未见 settled(含骨架未装)即撤;attr 保持 'heavy-pending' 如实,不造假
  setTimeout(() => {
    const p = getp();
    if (!(p && p.settled)) { done = true; obs.disconnect(); dbg('hv:settle-timeout'); }
  }, CAPS.heavySettleAwait);
  // 帽2:全程观察窗(AI 晚到流)到点收观察;在飞异步补写不受阻
  setTimeout(() => { done = true; obs.disconnect(); }, CAPS.heavyDeadline);
}
// document-idle 下 documentElement 必在;防御性有界等(帽 docElementGuard,沿 skeleton boot 守卫形)
const bootWait: ReturnType<typeof setInterval> = setInterval(() => {
  if (document.documentElement) {
    clearInterval(bootWait);
    boot();
  }
}, 50);
setTimeout(() => clearInterval(bootWait), CAPS.docElementGuard);
