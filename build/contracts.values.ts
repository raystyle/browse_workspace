// contracts.ts — 双脚本对唯一契约源(con-06 用户令:定好契约生成 rn 或油猴脚本)
// zod schema + 通道常量 + 三要素帽;build 由此生成产物,check 由此校验不变量。
// 值件:零依赖,产物侧唯一进口(con-06:zod 全量打包致 probe 虚胖 810KB 的教训)

// ---------- 通道常量(attr 名与事件面) ----------
export const CHANNEL = {
  probeAttr: 'probe',
  eventsPath: '/events',
  slug: 'google-search',
} as const;

// ---------- 三要素帽(毫秒;唯一权威,mech/probe 由 build 注入) ----------
export const CAPS = {
  docElementGuard: 3000,
  settleAwait: 20000,
  reloadSettleAwait: 15000,
  consentReawait: 15000,
  commitPollTick: 300,
  commitPollTries: 30, // 9s 提交探测
  pageComplete: 12000,
  aiStable: 1200,
  aiDeadline: 10000,
  transientRetryMs: 1000,
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

export const TEXT_CAPS = { snippet: 300, pageText: 12000, pageHtml: 16000, aiText: 4000, mdPage: 24000, mdHtmlIn: 500000 } as const;
