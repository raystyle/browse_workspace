// check.ts — browse_workspace P0 回归网(grok 测试方案 2026-10-10;TS+zod 统一)
// 零浏览器零 daemon:头检查 + 九张 @detect 表 + prelude 运行时(vm 桩)。
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Tally, DetectHit, SeeBody, type DetectHit as DetectHitT } from './lib.ts';
import { ContentTiers } from '../build/framework/schemas.ts';
import { digestText, extractHighlights } from '../build/framework/tiers.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'page-skills');
const t = new Tally();

// ---------- ① 头检查 ----------
const slugs = readdirSync(PK, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();
t.eq('十二对在册', slugs, [
  'antibot-vendor', 'challenge-stop', 'fingerprint-watch', 'gm-bridge',
  'google-search', 'human-gate', 'link-table', 'next-page', 'policy-surface',
  'response-tap', 'scroll-until-end', 'spa-route',
]);
// 两段式探针对(skeleton+heavy 双件)按存在性识别;单件对沿用 probe.user.js(REQ-041 P0)
function probeFiles(slug: string): string[] {
  const dir = join(PK, slug);
  if (existsSync(join(dir, 'probe.skeleton.user.js'))) return ['probe.skeleton.user.js', 'probe.heavy.user.js'];
  return ['probe.user.js'];
}
for (const slug of slugs) {
  const dir = join(PK, slug);
  const probes = probeFiles(slug).map((f) => readFileSync(join(dir, f), 'utf8'));
  readFileSync(join(dir, 'mech.rn'), 'utf8'); // 成对才算,读得到即在
  // detect 块以对为单位恰一(两段式下住在 skeleton;heavy 无)
  const opens = probes.reduce((n, s) => n + (s.match(/\/\* @detect \*\//g) ?? []).length, 0);
  const closes = probes.reduce((n, s) => n + (s.match(/\/\* @enddetect \*\//g) ?? []).length, 0);
  t.ok(`${slug}: detect 标记成对(各一)`, opens === 1 && closes === 1, `open=${opens} close=${closes}`);
  probes.forEach((probe, i) => {
    const fname = probeFiles(slug)[i];
    if (/GM_xmlhttpRequest/.test(probe)) {
      t.ok(`${slug}/${fname}: 用 GM 必带 @grant`, /@grant\s+GM_xmlhttpRequest/.test(probe));
      t.ok(
        `${slug}/${fname}: 用 GM 必带 @connect 127.0.0.1 非 localhost`,
        /@connect\s+127\.0\.0\.1/.test(probe) && !/@connect\s+localhost/.test(probe),
      );
    }
    const runAt = (probe.match(/@run-at\s+(\S+)/) ?? [])[1];
    t.ok(`${slug}/${fname}: @run-at 只认 start/idle`, runAt === 'document-start' || runAt === 'document-idle', String(runAt));
  });
}

// ---------- ①b vendor 钉版守卫(google-search 重段内嵌 mdream) ----------
{
  const vendor = readFileSync(join(ROOT, 'scripts/vendor/mdream.iife.js'), 'utf8');
  const sidecar = readFileSync(join(ROOT, 'scripts/vendor/mdream.iife.js.sha256'), 'utf8').trim();
  const actual = createHash('sha256').update(vendor).digest('hex');
  t.ok('vendor: mdream sha256 边车对账', sidecar.startsWith(actual), `sidecar=${sidecar} actual=${actual}`);
  t.ok('vendor: LICENSE 注记在', existsSync(join(ROOT, 'scripts/vendor/LICENSE-mdream.txt')));
  const gsHeavy = readFileSync(join(PK, 'google-search/probe.heavy.user.js'), 'utf8');
  t.ok('google-search: vendored mdream 字节等内嵌(heavy 段)', gsHeavy.includes(vendor));
  t.ok('google-search: mdream 暴露形在(window.mdream)', /window\.mdream\s*=/.test(vendor));
}

// ---------- ①b' 两段式守卫(R3 教训固化为门:skeleton 轻、重库只在 heavy) ----------
{
  const sk = readFileSync(join(PK, 'google-search/probe.skeleton.user.js'), 'utf8');
  const hv = readFileSync(join(PK, 'google-search/probe.heavy.user.js'), 'utf8');
  t.ok('google-search: skeleton 体积 ≤20KB(R3 门)', Buffer.byteLength(sk) <= 20 * 1024, `${Buffer.byteLength(sk)}B`);
  t.ok('google-search: skeleton @run-at document-start(采样要早)', /@run-at\s+document-start/.test(sk));
  t.ok('google-search: heavy @run-at document-idle(重库要晚)', /@run-at\s+document-idle/.test(hv));
  t.ok('google-search: skeleton 零 mdream(重库禁入骨架)', !sk.includes('htmlToMarkdown'));
  t.ok('google-search: heavy 零 GM 面(纯 DOM 富集)', !/GM_xmlhttpRequest/.test(hv));
  t.ok('google-search: 旧单件 probe.user.js 已退役', !existsSync(join(PK, 'google-search/probe.user.js')));
}

// ---------- ①c 生成物在位轻检(真 lint = build:tsc 类型 + esbuild 语法;此处只验在位与守卫) ----------
{
  const gsMech = readFileSync(join(PK, 'google-search/mech.rn'), 'utf8');
  t.ok('google-search: mech 生成头在(勿手改)', gsMech.startsWith('// google-search 宿主编排(生成物'));
  t.ok('google-search: mech 模板必填键只用在册 vars', [...new Set([...gsMech.matchAll(/<%=\s*(\w+)\s*%>/g)].map((m) => m[1]))].join(',') === 'q,top');
  t.ok('google-search: skeleton 生成头在(勿手改)', readFileSync(join(PK, 'google-search/probe.skeleton.user.js'), 'utf8').includes('本文件是生成物(build/build.mts 产'));
  t.ok('google-search: heavy 生成头在(勿手改)', readFileSync(join(PK, 'google-search/probe.heavy.user.js'), 'utf8').includes('本文件是生成物(build/build.mts 产'));
}

// ---------- ①d 内容三档契约面(REQ-041 P1 件1:zod ContentTiers + 纯函数基 + 产物携带) ----------
{
  const good = { snippet: 'a'.repeat(500), highlights: ['x'], main: '# t' };
  t.parses('tiers: 500 字边界过', ContentTiers, good);
  t.ok('tiers: snippet >500 拒', !ContentTiers.safeParse({ ...good, snippet: 'a'.repeat(501) }).success);
  t.ok('tiers: main null 容(未做 md 转换如实形)', ContentTiers.safeParse({ snippet: 's', highlights: [], main: null }).success);
  t.ok('tiers: highlights 非串数组拒', !ContentTiers.safeParse({ ...good, highlights: [1] }).success);
  t.eq('digestText: 折叠空白+截帽', digestText('  a\n\n b   c  ', 3), 'a b');
  t.eq('digestText: 空入空出', digestText(null as unknown as string, 5), '');
  t.eq('extractHighlights: 只收结构线(标题/列表/有序)', extractHighlights('# T\n- a\nplain\n* b\n2) c', 10, 240), ['T', 'a', 'b', 'c']);
  t.eq('extractHighlights: 条数帽', extractHighlights('- 1\n- 2\n- 3', 2, 240).length, 2);
  t.eq('extractHighlights: 单条长度帽', extractHighlights('- ' + 'x'.repeat(300), 10, 240)[0].length, 240);
  const sk = readFileSync(join(PK, 'google-search/probe.skeleton.user.js'), 'utf8');
  t.ok('google-search: skeleton 首写 tiers 预置 null', sk.includes('tiers: null'));
  const hv = readFileSync(join(PK, 'google-search/probe.heavy.user.js'), 'utf8');
  t.ok('google-search: heavy 富集带三档计算(buildTiers 入体)', hv.includes('highlights') && hv.includes('tierSnippet'));
  const gsMech = readFileSync(join(PK, 'google-search/mech.rn'), 'utf8');
  t.ok('google-search: mech 出参页级 tiers(extractPage 体)', gsMech.includes('tiers: { snippet:'));
}

// ---------- ② 九张 @detect 表(vm 喂 facts) ----------
function detectFn(slug: string): (facts: Record<string, unknown>) => DetectHitT | null {
  // detect 块以对为单位恰一(① 已守),跨件找到所在文件再取块
  let m: RegExpMatchArray | null = null;
  for (const f of probeFiles(slug)) {
    const src = readFileSync(join(PK, slug, f), 'utf8');
    m = src.match(/\/\* @detect \*\/([\s\S]*?)\/\* @enddetect \*\//);
    if (m) break;
  }
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
const GS: DetectHitT = { slug: 'google-search', confidence: 'PLAUSIBLE' };
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
  ...([
    ['google-search', { isGoogleSerp: true, hasTurnstile: true }],
    ['google-search', { isGoogleSerp: true, hasChallengeDom: true }],
  ] as const).map(([slug, facts]) => [slug, facts, GS] as const),
  ['google-search', { isGoogleSerp: true }, null], // SERP 正常态不点名,走显式 rune 道
  ['google-search', { hasTurnstile: true }, null], // 非 google 页不点名
  ['google-search', {}, null],
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
process.exit(t.summary('check.ts', 152));
