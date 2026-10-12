// contracts.values.ts — google-search 对契约值面(消费 build/framework 基,REQ-041 P0 SDK 泛化起步)
// 值件:零依赖,产物侧唯一进口(con-06:zod 全量打包致 probe 虚胖 810KB 的教训)。
// 通道常量基/CAPS 基在 framework/values.ts;本件只留 pair 特有面(slug/选择器/文本帽/pair 帽)。
import { BASE_CAPS, CHANNEL_BASE } from './framework/values.ts';

// ---------- 通道常量(pair 特有:slug) ----------
export const CHANNEL = { ...CHANNEL_BASE, slug: 'google-search' } as const;

// ---------- 三要素帽(毫秒;唯一权威,mech/probe 由 build 注入;基帽见 framework) ----------
export const CAPS = {
  ...BASE_CAPS,
  consentReawait: 15000,
  commitPollTick: 300,
  commitPollTries: 30, // 9s 提交探测
  aiStable: 1200,
  aiDeadline: 10000,
  // follow 模式(REQ-041 P1 件2):两拍稳节拍 / 结果页内容等待硬帽 / 导航预算(1 SERP+≤N goto 跳)
  followBeat: 800,
  followDeadline: 15000,
  followBudget: 5,
} as const;

// ---------- 判读常量(选择器版本与内外链规则) ----------
export const SELECTORS = {
  version: '2026-10-10.3',
  primary: '#search h3, #rso h3, div#main h3',
  fallbackScope: '#search a[href], #rso a[href], div#main a[href], main a[href]',
  gotoRe: /^https:\/\/www\.google\.com\/goto\?url=/,
  internalRe:
    /^(?:[a-z0-9-]+\.)*(?:google\.[a-z.]+|googleusercontent\.com|gstatic\.com|ggpht\.com|youtube\.[a-z.]+|blogger\.com|googleadservices\.com|doubleclick\.net)\//i,
} as const;

export const TEXT_CAPS = {
  snippet: 300,
  pageText: 12000,
  pageHtml: 16000,
  aiText: 4000,
  mdPage: 24000,
  mdHtmlIn: 500000,
  // 内容三档(REQ-041 P1 件1):snippet 档字数帽 / 要点单条长度帽 / 要点条数帽
  tierSnippet: 500,
  tierHighlight: 240,
  tierHighlights: 8,
} as const;
