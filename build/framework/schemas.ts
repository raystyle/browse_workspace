// framework/schemas.ts — pair SDK schema 面(REQ-041 P0):mech 出参公共件(zod)。
// 各 pair 的 ProbePayload 归 pair 契约;ErrorRecord/PageRecord/ContentTiers 是全对共形,抽此消费。
import { z } from 'zod';

// ---------- 内容三档(REQ-041 P1 件1):snippet ≤500 字摘要 / highlights 要点 / main 全文 md ----------
// main 为 null = 该载体未做 md 转换(如结果页 pages,如实置空不假造);纯值面在 framework/tiers.ts。
export const ContentTiers = z.object({
  snippet: z.string().max(500),
  highlights: z.array(z.string()),
  main: z.string().nullable(),
});
export type ContentTiers = z.infer<typeof ContentTiers>;

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
export type PageRecord = z.infer<typeof PageRecord>;
