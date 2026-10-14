// check.ts — browse_workspace P0 回归网(grok 测试方案 2026-10-10;TS+zod 统一)
// 零浏览器零 daemon:头检查 + 九张 @detect 表 + prelude 运行时(vm 桩)。
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { Tally, DetectHit, SeeBody, type DetectHit as DetectHitT } from './lib.ts';
import { ContentTiers } from '../build/framework/schemas.ts';
import { MechOutput } from '../build/contracts.ts';
import { digestText, extractHighlights } from '../build/framework/tiers.ts';
import { JSDOM } from 'jsdom';
import { cssPath, xpath } from '../build/dompath.ts';
import { LEGACY_PAIRS, EXTRA_PAIRS, assembleLegacyProbe, legacyMech } from '../build/pairs.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'page-skills');
const t = new Tally();

// ---------- ① 头检查 ----------
const slugs = readdirSync(PK, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();
t.eq('十三对在册', slugs, [
  'antibot-vendor', 'challenge-stop', 'fingerprint-watch', 'gm-bridge',
  'google-search', 'human-gate', 'link-table', 'next-page', 'policy-surface',
  'response-tap', 'scroll-until-end', 'spa-route', 'x-search',
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

// ---------- ①e mode 两档与 follow 预算(REQ-041 P1 件2) ----------
{
  const gsMech = readFileSync(join(PK, 'google-search/mech.rn'), 'utf8');
  t.ok('google-search: mode 缺省槽在(serp 缺省,老调用零回归)', gsMech.includes(`"<%= mode | default('serp') %>"`));
  t.ok('google-search: follow 两拍稳体在(extractPageStable 入 mech)', gsMech.includes('function extractPageStable(args)') && gsMech.includes('"extractPageStable"'));
  t.ok('google-search: serp 提取体仍在(extractPage 双道保留)', gsMech.includes('function extractPage(args)'));
  t.ok('google-search: 预算闸与熔断回执体在(budgetOver/budgetReceipt)', gsMech.includes('function budgetOver(args)') && gsMech.includes('function budgetReceipt(args)'));
  t.ok('google-search: budget verdict 契约面(回执体带 verdict budget)', gsMech.includes('verdict: "budget"'));
  // 预算数值与契约同源:CAPS.followBudget 经 define 内联进 mech,与 contracts.values 源一致
  const cv = readFileSync(join(ROOT, 'build/contracts.values.ts'), 'utf8');
  const fb = (cv.match(/followBudget:\s*(\d+)/) ?? [])[1];
  t.ok('google-search: follow 预算数值 mech/契约同源', !!fb && gsMech.includes('Number(' + fb + ')'), `followBudget=${String(fb)}`);
  // 出参契约:serp 形(带 follow 页记录)与 budget 熔断回执形都过 MechOutput
  const probe = {
    slug: 'google-search', v: 'x', verdict: 'ok', drift: 'none', mainHits: 1, fallbackHits: 0,
    results: [{ title: 't', url: 'https://e/x', wrapped: null, snippet: 's', via: 'main' }],
    url: 'https://www.google.com/search?q=x', title: 'x', ts: 1, settled: true,
    markdown: 'm', tiers: { snippet: 's', highlights: [], main: 'm' }, converter: 'mdream@2.0.1/minimal',
    ai_overview: { present: false, text: null }, probe_debug: [],
  };
  t.parses('MechOutput: serp 形 + follow 页记录(stable/beats/tiers)', MechOutput, {
    probe,
    pages: [{ url: 'https://e/x', finalUrl: 'https://e/x', nav: 'ok', title: 'x', ready: 'complete', stable: true, beats: 4, text: 't', html: '<h1>t</h1>', tiers: { snippet: 's', highlights: [], main: null } }],
    errors: [],
  });
  t.parses('MechOutput: budget 熔断回执形(原子不假绿)', MechOutput, {
    probe: { ...probe, verdict: 'budget', settled: false, markdown: null, tiers: null, converter: 'budget', results: [] },
    pages: [],
    errors: [{ stage: 'follow', op: 'budget', message: 'follow 导航预算熔断' }],
  });
  t.ok('MechOutput: verdict budget 外非法值拒', !MechOutput.safeParse({ probe: { ...probe, verdict: 'bogus' }, pages: [], errors: [] }).success);
}

// ---------- ①f 九对遗产对 SDK 编译道钉版守卫(REQ-041 P1 件3):产物在位 + 与编译道字节等 ----------
{
  const dist = mkdtempSync(join(tmpdir(), 'ws-check-'));
  try {
    t.eq('九对遗产在册与编译道同相', [...LEGACY_PAIRS].sort(), [
      'challenge-stop', 'fingerprint-watch', 'human-gate', 'link-table', 'next-page',
      'policy-surface', 'response-tap', 'scroll-until-end', 'spa-route',
    ]);
    for (const slug of LEGACY_PAIRS) {
      const want = await assembleLegacyProbe(slug, dist);
      const got = readFileSync(join(PK, slug, 'probe.user.js'), 'utf8');
      t.ok(`${slug}: probe.user.js 与编译道字节等(钉版,手改会被 build 覆盖)`, got === want, `len got=${got.length} want=${want.length}`);
      const mech = readFileSync(join(PK, slug, 'mech.rn'), 'utf8');
      t.ok(`${slug}: mech.rn 与编译道源字节等(逐字拷贝钉版)`, mech === legacyMech(slug), `len got=${mech.length} want=${legacyMech(slug).length}`);
    }
    t.ok('policy-surface: 纯判定对 head 原样(空体出空串)', readFileSync(join(PK, 'policy-surface/probe.user.js'), 'utf8') === readFileSync(join(ROOT, 'build/pairs/policy-surface/probe.head.txt'), 'utf8'));
    for (const slug of EXTRA_PAIRS) {
      const want = await assembleLegacyProbe(slug, dist);
      const got = readFileSync(join(PK, slug, 'probe.user.js'), 'utf8');
      t.ok(`${slug}: probe.user.js 与编译道字节等`, got === want, `len got=${got.length} want=${want.length}`);
      const mech = readFileSync(join(PK, slug, 'mech.rn'), 'utf8');
      t.ok(`${slug}: mech.rn 与编译道源字节等`, mech === legacyMech(slug), `len got=${mech.length} want=${legacyMech(slug).length}`);
    }
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
}

// ---------- ①g gm-bridge 默认拒(前缀表在源码,不走事件) ----------
{
  const gmb = readFileSync(join(PK, 'gm-bridge/probe.user.js'), 'utf8');
  t.ok(
    'gm-bridge: 前缀表只含 8872',
    /var ALLOW_FETCH = \['http:\/\/127\.0\.0\.1:8872\/'\];/.test(gmb),
  );
  const allowAt = gmb.indexOf('function allowed(');
  const xhrAt = gmb.indexOf('GM_xmlhttpRequest({');
  t.ok('gm-bridge: allowed 定义早于 GM_xhr 调用', allowAt !== -1 && xhrAt !== -1 && allowAt < xhrAt);
  t.ok('gm-bridge: 不调用 GM 存储', !/GM_getValue|GM_setValue/.test(gmb));
}

// ---------- ①h next-page 路径盖章与 mech 回退 ----------
{
  const npMech = readFileSync(join(PK, 'next-page/mech.rn'), 'utf8');
  const npProbe = readFileSync(join(PK, 'next-page/probe.user.js'), 'utf8');
  t.ok('next-page: 探针选择器含 title', npProbe.includes('a[title="Next"]'));
  t.ok('next-page: mech 选择器无 title', npMech.includes('a[rel=next]') && !npMech.includes('a[title="Next"]'));
  t.ok('next-page: 循环 200 与等待 1500ms', npMech.includes('while i < 200') && npMech.includes('from_millis(1500)'));
  t.ok(
    'next-page: 探针写下 css 与 xpath',
    npProbe.includes('data-browse-css') && npProbe.includes('data-browse-xpath') && npProbe.includes('data-browse-next'),
  );
  t.ok('next-page: 路径含 nth-child', npProbe.includes('nth-child'));
  t.ok(
    'next-page: mech 回退读属性',
    npMech.includes('data-browse-css') && npMech.includes('data-browse-xpath') && npMech.includes('document.evaluate'),
  );
  const pickAt = npMech.indexOf('function pick()');
  const pickEnd = npMech.indexOf('var n=pick()');
  t.ok('next-page: pick 体无井号引号序列', pickAt >= 0 && pickEnd > pickAt && !npMech.slice(pickAt, pickEnd).includes('"#'));
}

// ---------- ①i x-search 实时搜索 ----------
{
  const xsMech = readFileSync(join(PK, 'x-search/mech.rn'), 'utf8');
  const xsProbe = readFileSync(join(PK, 'x-search/probe.user.js'), 'utf8');
  t.ok('x-search: 实时搜索 URL', xsMech.includes('f=live') && xsMech.includes('x.com/search?q='));
  t.ok('x-search: 探针用 tweetText', xsProbe.includes('[data-testid="tweetText"]'));
  t.ok('x-search: 250ms 轮询与刷新', xsMech.includes('while i < 40') && xsMech.includes('from_millis(250)') && xsMech.includes('reloadPage'));
  t.ok('x-search: rounds 缺省 2', xsMech.includes('<%= rounds | default(2) %>'));
  t.ok('x-search: 探针零 mdream', !xsProbe.includes('htmlToMarkdown') && !xsProbe.includes('window.mdream'));
  t.ok(
    'x-search: 网络错误自愈',
    xsMech.includes('chrome-error://') &&
      xsMech.includes('出错了') &&
      xsMech.includes('Something went wrong') &&
      xsMech.includes('verdict\\":\\"net\\"') &&
      xsMech.includes('heals') &&
      xsMech.includes('cdp::goto(u.clone())') &&
      xsMech.includes('else if tick.starts_with("NET\\n")'),
  );
}

// ---------- ①j 主世界封钩与元素路径 ----------
{
  const spa = readFileSync(join(PK, 'spa-route/probe.user.js'), 'utf8');
  const tap = readFileSync(join(PK, 'response-tap/probe.user.js'), 'utf8');
  const links = readFileSync(join(PK, 'link-table/probe.user.js'), 'utf8');
  const pre = readFileSync(join(PK, '_prelude.js'), 'utf8');
  t.ok('spa-route: 授权 unsafeWindow', /@grant\s+unsafeWindow/.test(spa));
  t.ok(
    'spa-route: 封死 pushState 并留登记表',
    spa.includes('writable: false') && spa.includes('configurable: false') && spa.includes('__browseRouteHooks'),
  );
  t.ok('response-tap: 授权 unsafeWindow', /@grant\s+unsafeWindow/.test(tap));
  t.ok(
    'response-tap: 记下 open、WebSocket、EventSource',
    tap.includes('WebSocket') && tap.includes('EventSource') && tap.includes('Reflect.construct') && /note\(/.test(tap) && /open/.test(tap),
  );
  t.ok('link-table: 授权 unsafeWindow', /@grant\s+unsafeWindow/.test(links));
  t.ok('link-table: 导出 items 与 nth-child', links.includes('items') && links.includes('nth-child') && links.includes('data-browse-css'));
  t.ok('prelude: 已封钩改走登记表', pre.includes('configurable === false') && pre.includes('__browseRouteHooks'));
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
  ...(['gm-bridge', 'human-gate', 'x-search'] as const).map(
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
  const desc = Object.getOwnPropertyDescriptor(sb.history as object, 'pushState');
  t.ok('route 封死 pushState', desc?.writable === false && desc?.configurable === false);
  let assignThrew = false;
  try { (sb.history as { pushState: unknown }).pushState = function () {}; } catch { assignThrew = true; }
  t.ok('route 封死后再赋值抛', assignThrew);
}
{
  const sb = runtimeSandbox();
  const hooks: Array<(e: { kind: string }) => void> = [];
  (sb as { __browseRouteHooks: typeof hooks }).__browseRouteHooks = hooks;
  function sealedPush() { hooks.forEach((h) => h({ kind: 'pushState' })); }
  Object.defineProperty(sb.history as object, 'pushState', { value: sealedPush, writable: false, configurable: false });
  Object.defineProperty(sb.history as object, 'replaceState', { value: function () {}, writable: false, configurable: false });
  const R = loadRuntime(sb);
  const seen: string[] = [];
  R.route((e) => seen.push(e.kind));
  (sb.history as { pushState: () => void }).pushState();
  t.eq('已封钩时 route 仍收到 pushState', seen, ['pushState']);
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

{
  const sb = runtimeSandbox();
  const isolatedPush = function isolatedPush() { return 'isolated'; };
  const pagePush = function pagePush(_s: unknown, _t: string, url?: string) {
    if (url) (sb.location as { href: string }).href = 'http://127.0.0.1:8871' + url;
    return 'page';
  };
  sb.history = { pushState: isolatedPush, replaceState() {} };
  const page = {
    history: { pushState: pagePush, replaceState() {} },
    addEventListener() {},
  };
  sb.unsafeWindow = page;
  const posts: { data?: { kind?: string } }[] = [];
  sb.GM_xmlhttpRequest = (o: { data: string }) => { posts.push(JSON.parse(o.data)); };
  vm.createContext(sb);
  vm.runInContext(readFileSync(join(PK, 'spa-route/probe.user.js'), 'utf8'), sb);
  t.ok('spa-route 不动油猴窗 history', (sb.history as { pushState: unknown }).pushState === isolatedPush);
  const d = Object.getOwnPropertyDescriptor(page.history, 'pushState');
  t.ok('spa-route 封死页面 pushState', d?.writable === false && d?.configurable === false);
  const got = (page.history.pushState as (a: unknown, b: string, u: string) => string)({}, '', '/n');
  t.eq('spa-route 仍调用原 pushState', got, 'page');
  t.eq('spa-route 上报 kind', posts.map((p) => p.data?.kind), ['pushState']);
  let threw = false;
  try { page.history.pushState = function () { return 'nope'; }; } catch { threw = true; }
  t.ok('spa-route 页面窗赋值抛', threw);
}
{
  const sb = runtimeSandbox();
  function RawWS(this: { url: string }, url: string) { this.url = url; }
  function RawES(this: { url: string }, url: string) { this.url = url; }
  const opened: string[] = [];
  const page: Record<string, unknown> = {
    open(url: string) { opened.push(url); return url; },
    WebSocket: RawWS,
    EventSource: RawES,
  };
  sb.unsafeWindow = page;
  const tops: string[] = [];
  sb.GM_xmlhttpRequest = (o: { data: string }) => {
    const body = JSON.parse(o.data) as { data?: { topKeys?: string[] } };
    tops.push(body.data?.topKeys?.[0] ?? '');
  };
  vm.createContext(sb);
  vm.runInContext(readFileSync(join(PK, 'response-tap/probe.user.js'), 'utf8'), sb);
  const tap = page.__browseTap as { buf: { url: string; status: number; body: string }[] };
  (page as { __RT_FILTER: string[] }).__RT_FILTER = ['keep-me'];
  (page.open as (u: string) => void)('https://example.com/drop');
  (page.open as (u: string) => void)('https://example.com/keep-me');
  t.eq('response-tap open 过滤后只留一条', tap.buf.map((r) => r.url), ['https://example.com/keep-me']);
  t.eq('response-tap open 状态 0', tap.buf[0]?.status, 0);
  t.eq('response-tap open 摘要种类', tops, ['open']);
  (page as { __RT_FILTER: string[] }).__RT_FILTER = [];
  const ws = new (page.WebSocket as new (u: string) => { url: string })('ws://127.0.0.1/sock');
  const es = new (page.EventSource as new (u: string) => { url: string })('http://127.0.0.1/events');
  t.eq('response-tap WebSocket 实例保留 url', ws.url, 'ws://127.0.0.1/sock');
  t.eq('response-tap EventSource 实例保留 url', es.url, 'http://127.0.0.1/events');
  t.eq(
    'response-tap 缓冲含三条',
    tap.buf.map((r) => r.url),
    ['https://example.com/keep-me', 'ws://127.0.0.1/sock', 'http://127.0.0.1/events'],
  );
  const wd = Object.getOwnPropertyDescriptor(page, 'WebSocket');
  const ed = Object.getOwnPropertyDescriptor(page, 'EventSource');
  t.ok('response-tap 封死 WebSocket 与 EventSource', wd?.configurable === false && ed?.writable === false);
}
function domSandbox(dom: JSDOM): Record<string, unknown> {
  const w = dom.window;
  return {
    window: w,
    document: w.document,
    location: w.location,
    history: w.history,
    MutationObserver: w.MutationObserver,
    setInterval: () => 0,
    setTimeout: () => 0,
    CSS: w.CSS,
    XPathResult: w.XPathResult,
    GM_xmlhttpRequest() {},
    unsafeWindow: w,
  };
}
{
  const dom = new JSDOM(
    '<!doctype html><body><a id="only" href="/a">A</a><div id="box"><span></span><a href="/b">B</a></div></body>',
    { url: 'http://127.0.0.1/page' },
  );
  const w = dom.window;
  const sb = domSandbox(dom);
  vm.createContext(sb);
  vm.runInContext(readFileSync(join(PK, 'link-table/probe.user.js'), 'utf8'), sb);
  const doc = w.document;
  const only = doc.getElementById('only')!;
  const second = doc.querySelector('#box a')!;
  const items = (w as unknown as { __browseLinks: { items: { href: string; css: string; xpath: string }[] } }).__browseLinks.items;
  t.eq('link-table 两条', items.length, 2);
  t.eq('link-table 唯一 id 的 css', items[0]?.css, cssPath(only));
  t.eq('link-table 唯一 id 的 xpath', items[0]?.xpath, xpath(only));
  t.eq('link-table 嵌套 css 与 dompath 一致', items[1]?.css, cssPath(second));
  t.eq('link-table 嵌套 xpath 与 dompath 一致', items[1]?.xpath, xpath(second));
  t.ok('link-table css 能找回节点', doc.querySelector(items[1]!.css) === second);
  t.eq('link-table 锚点写上 css', second.getAttribute('data-browse-css'), items[1]?.css);
  const found = doc.evaluate(items[1]!.xpath, doc, null, w.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  t.ok('link-table xpath 能找回节点', found === second);
}
{
  const dom = new JSDOM('<!doctype html><body><div id="box"><span></span><a class="x" href="/z"></a></div></body>', { url: 'http://127.0.0.1/' });
  const a = dom.window.document.querySelector('a.x')!;
  const css = cssPath(a);
  const xp = xpath(a);
  t.ok('dompath css 含 nth-child', css.includes('nth-child'));
  t.ok('dompath css 找回', dom.window.document.querySelector(css) === a);
  const viaXp = dom.window.document.evaluate(xp, dom.window.document, null, dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  t.ok('dompath xpath 找回', viaXp === a);
  const withId = dom.window.document.getElementById('box')!;
  t.eq('dompath 唯一 id 停在 #id', cssPath(withId), '#box');
  t.eq('dompath 唯一 id 的 xpath', xpath(withId), '//*[@id="box"]');
}
{
  const npProbe = readFileSync(join(PK, 'next-page/probe.user.js'), 'utf8');
  const dom = new JSDOM('<!doctype html><body><main><a id="nxt" title="Next" href="/p2">Next</a></main></body>', { url: 'http://127.0.0.1/list' });
  const sb = domSandbox(dom);
  vm.createContext(sb);
  vm.runInContext(npProbe, sb);
  const a = dom.window.document.getElementById('nxt')!;
  t.eq('next-page 探针盖章', a.getAttribute('data-browse-next'), '1');
  t.eq('next-page 探针 css', a.getAttribute('data-browse-css'), '#nxt');
  t.eq('next-page 探针 xpath', a.getAttribute('data-browse-xpath'), '//*[@id="nxt"]');
  a.removeAttribute('title');
  a.removeAttribute('data-browse-next');
  let clicks = 0;
  a.click = () => { clicks += 1; };
  const mech = readFileSync(join(PK, 'next-page/mech.rn'), 'utf8');
  const start = mech.indexOf('(function(){function pick()');
  const marker = 'return true})()';
  const end = mech.indexOf(marker);
  const fn = start >= 0 && end > start ? mech.slice(start, end + marker.length) : '';
  const hit = Boolean(fn && vm.runInContext(fn, sb));
  t.ok('next-page 选择器漂了仍点到 css', hit && clicks === 1);
  a.removeAttribute('data-browse-css');
  const hold = dom.window.document.createElement('i');
  hold.setAttribute('data-browse-xpath', '//*[@id="nxt"]');
  dom.window.document.body.appendChild(hold);
  clicks = 0;
  const hitX = Boolean(fn && vm.runInContext(fn, sb));
  t.ok('next-page xpath 回退仍点到', hitX && clicks === 1);
}

await new Promise((r) => setTimeout(r, 30)); // 等异步 tap 断言
process.exit(t.summary('check.ts', 181));
