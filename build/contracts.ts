// contracts.ts — google-search schema 面(zod);值面在 contracts.values.ts(产物零 zod)
// ErrorRecord/PageRecord 公共件已抽 build/framework/schemas.ts(REQ-041 P0),此处转口消费。
import { z } from 'zod';
import { ErrorRecord, PageRecord } from './framework/schemas.ts';
export * from './contracts.values.ts';
export { ErrorRecord, PageRecord };

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
  converter: z.string(),
  ai_overview: AiOverview,
  probe_debug: z.array(DbgEntry),
});

export const MechOutput = z.object({
  probe: ProbePayload.nullable(),
  pages: z.array(PageRecord),
  errors: z.array(ErrorRecord),
});
