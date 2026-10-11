// framework/schemas.ts — pair SDK schema 面(REQ-041 P0):mech 出参公共件(zod)。
// 各 pair 的 ProbePayload 归 pair 契约;ErrorRecord/PageRecord 是全对共形,抽此消费。
import { z } from 'zod';

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
