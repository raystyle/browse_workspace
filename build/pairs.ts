// pairs.ts — 九对遗产 pair 的 SDK 编译道共享件(REQ-041 P1 件3)。
// build.mts(产 page-skills/<slug>/probe.user.js + mech.rn)与 tests/check.ts(字节等钉版守卫)同源消费,
// 编译道单一权威:源 build/pairs/<slug>/{probe.head.txt, probe.body.ts, mech.rn},手改产物会被 build 覆盖。
import { build as esbuild } from 'esbuild';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LEGACY_PAIRS = [
  'next-page', 'scroll-until-end', 'link-table', 'response-tap', 'fingerprint-watch',
  'challenge-stop', 'human-gate', 'spa-route', 'policy-surface',
] as const;
export type LegacyPair = (typeof LEGACY_PAIRS)[number];

/** 新增单件对,编译形与遗产对相同(head + body.ts + mech.rn),不进九对钉版名单。 */
export const EXTRA_PAIRS = ['x-search'] as const;
export type ExtraPair = (typeof EXTRA_PAIRS)[number];
export type SinglePair = LegacyPair | ExtraPair;

const HERE = dirname(fileURLToPath(import.meta.url));
export const PAIRS_SRC = join(HERE, 'pairs');

/** 空 ATP:体源剥注释/空白后无语句(纯判定对,detect 块住 head)→ 体出空串,probe 保持 head 原样 */
function bodyIsEmpty(src: string): boolean {
  return src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim() === '';
}

/** 单对 probe 组装:head(逐字:userscript 头 + @detect 块)+ esbuild 体(IIFE chrome155)。 */
export async function assembleLegacyProbe(slug: SinglePair, distDir: string): Promise<string> {
  const head = readFileSync(join(PAIRS_SRC, slug, 'probe.head.txt'), 'utf8');
  const srcPath = join(PAIRS_SRC, slug, 'probe.body.ts');
  if (bodyIsEmpty(readFileSync(srcPath, 'utf8'))) return head;
  await esbuild({
    entryPoints: [srcPath],
    bundle: true,
    format: 'iife',
    target: 'chrome155',
    outfile: join(distDir, 'probe-' + slug + '.body.js'),
    logLevel: 'silent',
  });
  return head + readFileSync(join(distDir, 'probe-' + slug + '.body.js'), 'utf8');
}

/** 单对 mech 源(逐字拷贝;九对 mech 非模板形态,编排体就是源) */
export function legacyMech(slug: SinglePair): string {
  return readFileSync(join(PAIRS_SRC, slug, 'mech.rn'), 'utf8');
}
