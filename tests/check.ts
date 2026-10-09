// check.ts — browse_workspace P0 回归网(grok 测试方案 2026-10-10;TS+zod 统一)
// 零浏览器零 daemon:头检查 + 九张 @detect 表 + prelude 运行时(vm 桩)。
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Tally, DetectHit, SeeBody, type DetectHit as DetectHitT } from './lib.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'page-skills');
const t = new Tally();

// ---------- ① 头检查 ----------
const slugs = readdirSync(PK, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();
t.eq('十一对在册', slugs, [
  'antibot-vendor', 'challenge-stop', 'fingerprint-watch', 'gm-bridge',
  'human-gate', 'link-table', 'next-page', 'policy-surface', 'response-tap',
  'scroll-until-end', 'spa-route',
]);
for (const slug of slugs) {
  const dir = join(PK, slug);
  const probe = readFileSync(join(dir, 'probe.user.js'), 'utf8');
  readFileSync(join(dir, 'mech.rn'), 'utf8'); // 成对才算,读得到即在
  if (/GM_xmlhttpRequest/.test(probe)) {
    t.ok(`${slug}: 用 GM 必带 @grant`, /@grant\s+GM_xmlhttpRequest/.test(probe));
    t.ok(
      `${slug}: 用 GM 必带 @connect 127.0.0.1 非 localhost`,
      /@connect\s+127\.0\.0\.1/.test(probe) && !/@connect\s+localhost/.test(probe),
    );
  }
  const opens = (probe.match(/\/\* @detect \*\//g) ?? []).length;
  const closes = (probe.match(/\/\* @enddetect \*\//g) ?? []).length;
  t.ok(`${slug}: detect 标记成对(各一)`, opens === 1 && closes === 1, `open=${opens} close=${closes}`);
  const runAt = (probe.match(/@run-at\s+(\S+)/) ?? [])[1];
  t.ok(`${slug}: @run-at 只认 start/idle`, runAt === 'document-start' || runAt === 'document-idle', String(runAt));
}

// ---------- ② 九张 @detect 表(vm 喂 facts) ----------
function detectFn(slug: string): (facts: Record<string, unknown>) => DetectHitT | null {
  const src = readFileSync(join(PK, slug, 'probe.user.js'), 'utf8');
  const m = src.match(/\/\* @detect \*\/([\s\S]*?)\/\* @enddetect \*\//);
  if (!m) throw new Error(slug + ' 无 detect 块');
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  vm.runInContext(m[1] + '\nthis.__f = browseDetect;', ctx);
  return ctx.__f as (f: Record<string, unknown>) => DetectHitT | null;
}
// 表驱动:每组 [facts, want];命中形经 zod DetectHit 校验(非法形也算红)
const CS: DetectHitT = { slug: 'challenge-stop', confidence: 'CONFIRMED' };
const AB: DetectHitT = { slug: 'antibot-vendor', confidence: 'PLAUSIBLE' };
const SE: DetectHitT = { slug: 'scroll-until-end', confidence: 'PLAUSIBLE' };
const NP: DetectHitT = { slug: 'next-page', confidence: 'CONFIRMED' };
const SR: DetectHitT = { slug: 'spa-route', confidence: 'PLAUSIBLE' };
const PS: DetectHitT = { slug: 'policy-surface', confidence: 'PLAUSIBLE' };
const TABLE: ReadonlyArray<readonly [string, Record<string, unknown>, DetectHitT | null]> = [
  ['challenge-stop', { hasTurnstile: true }, CS],
  ['challenge-stop', { hasChallengeDom: true }, CS],
  ['challenge-stop', { scriptVendor: { cloudflare: true } }, CS],
  ['challenge-stop', { scriptVendor: { recaptcha: true } }, CS],
  ['challenge-stop', { scriptVendor: { hcaptcha: true } }, CS],
  ['challenge-stop', { cfCookie: true }, null], // cookie 名是 antibot 的事实
  ['challenge-stop', { scriptVendor: {} }, null],
  ['challenge-stop', {}, null],
  ...(['cloudflare', 'akamai', 'datadome', 'imperva'] as const).map(
    (v) => ['antibot-vendor', { scriptVendor: { [v]: true } }, AB] as const,
  ),
  ['antibot-vendor', { cfCookie: true }, AB],
  ['antibot-vendor', { akamaiCookie: true }, AB],
  ['antibot-vendor', { scriptVendor: {} }, null],
  ['antibot-vendor', {}, null],
  ['scroll-until-end', { viewportHeight: 800, docHeight: 3200 }, SE],
  ['scroll-until-end', { viewportHeight: 800, docHeight: 3199 }, null],
  ['scroll-until-end', { viewportHeight: 0, docHeight: 99999 }, null],
  ['scroll-until-end', {}, null],
  ['next-page', { hasRelNext: true }, NP],
  ['next-page', { hasRelNext: false }, null],
  ['next-page', {}, null],
  ['spa-route', { framework: { name: 'react', version: null } }, SR],
  ['spa-route', { framework: { name: 'vue', version: '3' } }, SR],
  ['spa-route', { framework: null }, null],
  ['spa-route', {}, null],
  // 恒 null 三对:不许开始点名
  // 恒 null 五对:服务/导出型不许开始点名
  ...(['gm-bridge', 'human-gate'] as const).map(
    (slug) => [slug, {}, null] as const,
  ),
  ...(['response-tap', 'link-table', 'fingerprint-watch'] as const).flatMap(
    (slug) => [
      [slug, {}, null] as const,
      [slug, { framework: { name: 'react' }, hasRelNext: true, hasTurnstile: true }, null] as const,
    ],
  ),
  ['policy-surface', { cspMeta: true }, PS],
  ['policy-surface', { passwordVisible: true }, PS],
  ['policy-surface', { cspMeta: true, passwordVisible: true }, PS], // 仍是一条不是两条
  ['policy-surface', {}, null],
];
for (const [slug, facts, want] of TABLE) {
  const got = detectFn(slug)(facts);
  if (got !== null) t.parses(`${slug} 表命中形合法: ${JSON.stringify(facts).slice(0, 50)}`, DetectHit, got);
  t.eq(`${slug} 表: ${JSON.stringify(facts).slice(0, 60)}`, got, want);
}

// ---------- ③ prelude 运行时(vm 桩) ----------
interface Post { path: string; body: unknown }
interface ProbeR {
  see(o: { slug?: string; action?: string; data?: unknown; once?: string; throttleMs?: number }): boolean;
  rearm(): void;
  route(fn: (e: { kind: string }) => void): void;
  tap(name: string, fn: (ctx: { url: string; body?: string; status?: number; kind?: string }) => void): void;
}
function runtimeSandbox(): Record<string, unknown> & { posts: Post[] } {
  const posts: Post[] = [];
  const sb: Record<string, unknown> & { posts: Post[] } = { console, posts };
  sb.window = sb;
  sb.location = { href: 'http://127.0.0.1:8871/a', pathname: '/a' };
  sb.history = { pushState() {}, replaceState() {} };
  sb.GM_xmlhttpRequest = (o: { url: string; data: string }) => {
    posts.push({ path: o.url.replace(/^.*:\d+/, ''), body: JSON.parse(o.data) });
  };
  sb.setInterval = () => 0;
  sb.clearInterval = () => {};
  sb.setTimeout = () => 0;
  return sb;
}
function loadRuntime(sb: Record<string, unknown>): ProbeR {
  const src = readFileSync(join(PK, '_prelude.js'), 'utf8');
  const rt = src.split('// ---------- 判定 facts')[0];
  vm.createContext(sb);
  vm.runInContext(rt, sb);
  return (sb as { __probe: ProbeR }).__probe;
}
{
  const sb = runtimeSandbox();
  const R = loadRuntime(sb);
  t.eq('R.see 首发通', R.see({ slug: 'challenge-stop', action: 'rune', data: {} }), true);
  t.eq('R.see 同默认键拒', R.see({ slug: 'challenge-stop', action: 'rune', data: {} }), false);
  t.eq('R.see 不同 action 不撞', R.see({ slug: 'challenge-stop', action: 'read', data: {} }), true);
  R.rearm();
  t.eq('R.rearm 后同参可再发', R.see({ slug: 'challenge-stop', action: 'rune', data: {} }), true);
  t.eq('once 首发通', R.see({ slug: 'x', action: 'read', once: 'k1' }), true);
  (sb.location as { pathname: string }).pathname = '/b';
  t.eq('once 跨路径仍拒', R.see({ slug: 'x', action: 'read', once: 'k1' }), false);
  // POST body 全部过 SeeBody 契约(zod)
  for (const p of sb.posts) t.parses(`POST body 契约 ${p.path}`, SeeBody, p.body);
  // 无 GM 不抛
  const sb2: Record<string, unknown> = {
    console, setInterval: () => 0, clearInterval: () => {}, setTimeout: () => 0,
    location: { href: 'http://x/', pathname: '/' }, history: { pushState() {}, replaceState() {} },
  };
  sb2.window = sb2;
  vm.createContext(sb2);
  vm.runInContext(readFileSync(join(PK, '_prelude.js'), 'utf8').split('// ---------- 判定 facts')[0], sb2);
  let threw = false;
  try { (sb2 as unknown as { __probe: ProbeR }).__probe.see({ slug: 'y', action: 'rune' }); } catch { threw = true; }
  t.ok('无 GM 时 see 不抛', !threw);
}
{
  // route:登记表——每个回调都收到 pushState;rearm 生效
  const sb = runtimeSandbox();
  const R = loadRuntime(sb);
  const seenA: string[] = [], seenB: string[] = [];
  R.route((e) => seenA.push(e.kind));
  R.route((e) => seenB.push(e.kind));
  R.see({ slug: 'challenge-stop', action: 'rune' });
  (sb.history as { pushState: (a: unknown, b: string, u: string) => void }).pushState({}, '', '/b');
  t.eq('route 回调 A 收到 pushState', seenA, ['pushState']);
  t.eq('route 回调 B 也收到 pushState(登记表修复)', seenB, ['pushState']);
  t.eq('pushState 后 rearm 生效(同参可再发)', R.see({ slug: 'challenge-stop', action: 'rune' }), true);
}
{
  // tap:两过滤器各一次;响应体不被吃掉
  const sb = runtimeSandbox();
  const tx = JSON.stringify({ url: 'http://127.0.0.1:8871/api.json', n: 1 });
  sb.fetch = async (_u: unknown) => ({
    clone: () => ({ text: async () => tx }),
    status: 200,
    text: async () => tx,
  });
  const R = loadRuntime(sb);
  const hits: string[] = [];
  R.tap('t1', (ctx) => hits.push(`t1:${ctx.url}:${ctx.status}`));
  R.tap('t2', () => hits.push('t2'));
  void (async () => {
    const resp = await (sb as unknown as { fetch: (u: unknown) => Promise<{ text: () => Promise<string> }> }).fetch('http://127.0.0.1:8871/api.json');
    const body = await resp.text();
    setTimeout(() => {
      t.eq('tap 两过滤器各一次', hits.length, 2);
      t.ok('tap 响应体不被吃掉', body.includes('api.json'));
    }, 10);
  })();
}

await new Promise((r) => setTimeout(r, 30)); // 等异步 tap 断言
process.exit(t.summary('check.ts', 95));
