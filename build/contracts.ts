// contracts.ts — schema 面(zod);值面在 contracts.values.ts(产物零 zod)
import { z } from "zod";
export * from "./contracts.values.ts";

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

export const ErrorRecord = z.object({
  stage: z.string(),
  op: z.string(),
  message: z.string(),
});
export type ErrorRecord = z.infer<typeof ErrorRecord>;

export const PageRecord = z.object({
  url: z.string(),
  finalUrl: z.string().optional(),
  nav: z.enum(['ok', 'failed', 'eval-failed', 'switch-failed']).optional(),
  title: z.string().nullable().optional(),
  ready: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  error: z.string().optional(),
});

export const MechOutput = z.object({
  probe: ProbePayload.nullable(),
  pages: z.array(PageRecord),
  errors: z.array(ErrorRecord),
});
