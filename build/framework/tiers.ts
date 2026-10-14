// framework/tiers.ts — 内容三档纯函数基(REQ-041 P1 件1):md/文本 → {snippet, highlights, main}。
// 零依赖纪律沿 framework/values(con-06:产物侧 esbuild 内联,零 zod);zod 契约面在 framework/schemas.ts。
// 消费方:probe.heavy.ts(settled 后 SERP/AI md 富集,import 打包形)。

/** 折叠空白后截帽的摘要(字数帽调用方给;恒 ≤cap 字) */
export function digestText(s: string, cap: number): string {
  return String(s || '').replace(/\s+/g, ' ').trim().slice(0, cap);
}

/** 要点抽取:只收 md 结构线(标题/列表/有序项),各截 maxLen,最多 maxN 条;找不到如实空数组 */
export function extractHighlights(md: string, maxN: number, maxLen: number): string[] {
  const out: string[] = [];
  for (const raw of String(md || '').split('\n')) {
    if (out.length >= maxN) break;
    const m = /^(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+)(.+)$/.exec(raw.trim());
    if (m) out.push(digestText(m[1], maxLen));
  }
  return out;
}

/** md → 三档内容(REQ-041 件1):snippet ≤cap 字摘要,highlights 要点,main 全文 md */
export function buildTiers(
  md: string,
  caps: { snippet: number; highlightLen: number; highlights: number },
): { snippet: string; highlights: string[]; main: string } {
  return {
    snippet: digestText(md, caps.snippet),
    highlights: extractHighlights(md, caps.highlights, caps.highlightLen),
    main: md,
  };
}
