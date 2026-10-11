// build.mts — pair SDK 生成器唯一入口(con-06 用户令:定好契约,编译生成 rn 与油猴脚本)
// 用法:tsx build/build.mts [pair](pair 目录名,缺省 google-search;为第二对铺路,REQ-041 P0)
// 产:page-skills/<pair>/{probe.skeleton.user.js, probe.heavy.user.js, mech.rn}
// 源:build/{contracts,probe.skeleton,probe.heavy,mech.bodies}.ts + {probe.skeleton,probe.heavy}.head.txt + mech.template.rn
// 门链:pnpm typecheck && pnpm build && pnpm check(tsc 即 lint,esbuild 即语法保证;手改产物会被本 build 覆盖)
import { build as esbuild } from 'esbuild';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CAPS, TEXT_CAPS } from './contracts.values.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist-build');
const PAIR = process.argv[2] && process.argv[2] !== '' ? process.argv[2] : 'google-search';
const PKG = join(ROOT, 'page-skills', PAIR);
mkdirSync(DIST, { recursive: true });
if (!existsSync(PKG)) throw new Error('pair 目录不在: ' + PKG);

// 契约常量 -> esbuild define(体内引用编译期内联为字面量,单体 toString 自包含)
function defines(): Record<string, string> {
  // 裸名 define:mech.bodies 以 declare const + 裸名引用,编译期内联为字面量
  const d: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...CAPS, ...TEXT_CAPS } as Record<string, unknown>)) {
    d[k] = JSON.stringify(v);
  }
  return d;
}

// ---------- ① 探针两段式:骨架体(KB 级)+ 重体(settled 后 mdream 富集) ----------
await esbuild({
  entryPoints: [join(ROOT, 'build/probe.skeleton.ts')],
  bundle: true,
  format: 'iife',
  target: 'chrome155',
  define: defines(),
  outfile: join(DIST, 'probe-skeleton.body.js'),
  logLevel: 'warning',
});
await esbuild({
  entryPoints: [join(ROOT, 'build/probe.heavy.ts')],
  bundle: true,
  format: 'iife',
  target: 'chrome155',
  define: defines(),
  outfile: join(DIST, 'probe-heavy.body.js'),
  logLevel: 'warning',
});

// ---------- ② mech 逐体:bundle 后 toString 捕源(define 已内联) ----------
await esbuild({
  entryPoints: [join(ROOT, 'build/mech.bodies.ts')],
  bundle: true,
  format: 'esm',
  target: 'chrome155',
  define: defines(),
  outfile: join(DIST, 'mech-bodies.mjs'),
  logLevel: 'warning',
});
const mod = await import(pathToFileURL(join(DIST, 'mech-bodies.mjs')).href);
const bodies: Record<string, string> = {};
for (const [name, fn] of Object.entries(mod)) {
  if (typeof fn !== 'function') continue;
  bodies[name] = (fn as () => unknown).toString();
}
writeFileSync(join(DIST, 'mech-bodies.json'), JSON.stringify(bodies, null, 1));

// ---------- ③ 组装两件探针:skeleton = 头+体;heavy = 头+vendored mdream+体 ----------
const headSk = readFileSync(join(ROOT, 'build/probe.skeleton.head.txt'), 'utf8');
const headHv = readFileSync(join(ROOT, 'build/probe.heavy.head.txt'), 'utf8');
const vendor = readFileSync(join(ROOT, 'scripts/vendor/mdream.iife.js'), 'utf8');
const bodySk = readFileSync(join(DIST, 'probe-skeleton.body.js'), 'utf8');
const bodyHv = readFileSync(join(DIST, 'probe-heavy.body.js'), 'utf8');
writeFileSync(join(PKG, 'probe.skeleton.user.js'), headSk + bodySk + '\n');
writeFileSync(join(PKG, 'probe.heavy.user.js'), headHv + vendor + '\n' + bodyHv + '\n');

// ---------- ④ 渲染 mech.rn(模板槽注入体源) ----------
let tpl = readFileSync(join(ROOT, 'build/mech.template.rn'), 'utf8');
for (const [name, src] of Object.entries(bodies)) {
  const slot = '{{BODY:' + name + '}}';
  if (!tpl.includes(slot)) throw new Error('模板缺槽: ' + slot);
  // 体源进 r# 裸串:体不含 "# 序列(esbuild 产物无之;有则显式红)
  if (src.includes('"#')) throw new Error('体源含 "# 会破 r# 定界: ' + name);
  tpl = tpl.split(slot).join(src);
}
if (/{{BODY:/.test(tpl)) throw new Error('模板有槽无体: ' + (tpl.match(/{{BODY:\w+}}/g) || []).join(','));
writeFileSync(join(PKG, 'mech.rn'), tpl);

console.log(
  'build[' + PAIR + ']: probe.skeleton.user.js(' + (headSk + bodySk).length + 'B) + probe.heavy.user.js(' +
    (headHv + vendor + bodyHv).length + 'B,内嵌 mdream ' + vendor.length + 'B) + mech.rn(' + tpl.length + 'B),' +
    Object.keys(bodies).length + ' 体注入',
);
