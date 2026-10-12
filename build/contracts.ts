// contracts.ts — google-search schema 面(zod);值面在 contracts.values.ts(产物零 zod)
// ErrorRecord/PageRecord/ContentTiers 公共件已抽 build/framework/schemas.ts(REQ-041 P0/P1),此处转口消费。
import { z } from 'zod';
import { ContentTiers, ErrorRecord, PageRecord } from './framework/schemas.ts';
export * from './contracts.values.ts';
export { ContentTiers, ErrorRecord, PageRecord };

// ---------- 结果与载荷 schema ----------
export const Verdict = z.enum(['ok', 'consent', 'challenged', 'empty', 'nav-stall']);
export const Drift = z.enum(['none', 'suspected']);

export const SearchResult = z.object({
  title: z.string(),
  url: z.string(),
  wrapped: z.enum(['goto', 'null']).nullable(),
  snippet: z.string(),
  via: z.enum(['main', 'fallback']),
});

export const AiOverview = z.object({
  present: z.boolean(),
  text: z.string().nullable(),
  markdown: z.string().nullable().optional(),
  converter: z.string().nullable().optional(),
  // 内容三档(REQ-041 P1 件1):heavy 对 AI 块 md 的富集形;settled 前缺省(可选)
  tiers: ContentTiers.nullable().optional(),
});

export const DbgEntry = z.object({ t: z.number(), ev: z.string() });

export const ProbePayload = z.object({
  slug: z.literal('google-search'),
  v: z.string(),
  verdict: Verdict,
  drift: Drift,
  mainHits: z.number(),
  fallbackHits: z.number(),
  results: z.array(SearchResult).max(10),
  url: z.string(),
  title: z.string(),
  ts: z.number(),
  settled: z.boolean(),
  markdown: z.string().nullable(),
  // 内容三档(REQ-041 P1 件1):heavy settled 后对 SERP md 富集;骨架首写恒 null
  tiers: ContentTiers.nullable(),
  converter: z.string(),
  ai_overview: AiOverview,
  probe_debug: z.array(DbgEntry),
});

export const MechOutput = z.object({
  probe: ProbePayload.nullable(),
  pages: z.array(PageRecord),
  errors: z.array(ErrorRecord),
});
