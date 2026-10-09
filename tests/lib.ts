// lib.ts — 测试层共享:zod schema 与断言器(check.ts/facts.ts 共用)
import { z } from 'zod';

/** @detect 返回形:命中 {slug, confidence} 或 null */
export const DetectHit = z.object({
  slug: z.string(),
  confidence: z.enum(['CONFIRMED', 'PLAUSIBLE']),
});
export type DetectHit = z.infer<typeof DetectHit>;

/** 事件上报 POST body 形(daemon /events 契约的探针侧) */
export const SeeBody = z.object({
  type: z.literal('see'),
  slug: z.string().nullable(),
  url: z.string(),
  data: z.unknown().nullable(),
  action: z.enum(['read', 'rune', 'export']).nullable(),
});
export type SeeBody = z.infer<typeof SeeBody>;

/** facts 对象的骨架子集(黄金子集断言用的键域) */
export const FactsShape = z.object({
  hasTurnstile: z.boolean().optional(),
  hasChallengeDom: z.boolean().optional(),
  hasRelNext: z.boolean().optional(),
  cspMeta: z.boolean().optional(),
  cfCookie: z.boolean().optional(),
  akamaiCookie: z.boolean().optional(),
  scriptVendor: z.record(z.string(), z.boolean()).optional(),
  framework: z.object({ name: z.string(), version: z.string().nullable() }).optional(),
}).passthrough();
export type Facts = z.infer<typeof FactsShape>;

/** 断言器:累计过/败,末行汇总;少跑一条也算红由调用方下界把关 */
export class Tally {
  pass = 0;
  fail = 0;
  readonly fails: string[] = [];
  ok(name: string, cond: boolean, detail = ''): void {
    if (cond) this.pass++;
    else {
      this.fail++;
      this.fails.push(name + (detail ? ` :: ${detail}` : ''));
    }
  }
  eq<T>(name: string, got: T, want: T): void {
    const g = JSON.stringify(got), w = JSON.stringify(want);
    this.ok(name, g === w, `got ${g} want ${w}`);
  }
  /** zod 校验断言:schema.parse 过=过,败=红带 zod 错误行 */
  parses<S extends z.ZodTypeAny>(name: string, schema: S, value: unknown): z.infer<S> {
    const r = schema.safeParse(value);
    this.ok(name, r.success, r.success ? '' : JSON.stringify(r.error.issues));
    return r.success ? r.data : (undefined as never);
  }
  summary(label: string, minBound: number): number {
    if (this.fails.length) console.log(this.fails.map((f) => 'FAIL ' + f).join('\n'));
    console.log(`=== ${label} ${this.pass} 过 ${this.fail} 败(下界 ${minBound})===`);
    return this.fail > 0 || this.pass < minBound ? 1 : 0;
  }
}
