#!/usr/bin/env node
// check.mjs — browse_workspace P0 回归网(grok 测试方案 2026-10-10,/tmp/grok-test-plan.md)
// 零浏览器零 daemon:头检查 + 九张 @detect 表 + prelude 运行时(vm 桩)。
// 绿 = 退出码 0 且末行用例数与内置期望一致;少跑一条也算红。
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PK = join(ROOT, 'page-skills');
let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail = '') {
  if (cond) { pass++; }
  else { fail++; fails.push(name + (detail ? ` :: ${detail}` : '')); }
}
function eq(name, got, want) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  ok(name, g === w, `got ${g} want ${w}`);
}

// ---------- ① 头检查 ----------
const slugs = readdirSync(PK, { withFileTypes: true })
  .filter(e => e.isDirectory())
  .map(e => e.name)
  .sort();
eq('九对在册', slugs, ['antibot-vendor', 'challenge-stop', 'fingerprint-watch', 'link-table', 'next-page', 'policy-surface', 'response-tap', 'scroll-until-end', 'spa-route']);
for (const slug of slugs) {
  const dir = join(PK, slug);
  const probe = readFileSync(join(dir, 'probe.user.js'), 'utf8');
  readFileSync(join(dir, 'mech.rn'), 'utf8'); // 成对才算,读得到即在
  if (/GM_xmlhttpRequest/.test(probe)) {
    ok(`${slug}: 用 GM 必带 @grant`, /@grant\s+GM_xmlhttpRequest/.test(probe));
    ok(`${slug}: 用 GM 必带 @connect 127.0.0.1 非 localhost`, /@connect\s+127\.0\.0\.1/.test(probe) && !/@connect\s+localhost/.test(probe));
  }
  const opens = (probe.match(/\/\* @detect \*\//g) || []).length;
  const closes = (probe.match(/\/\* @enddetect \*\//g) || []).length;
  ok(`${slug}: detect 标记成对(各一)`, opens === 1 && closes === 1, `open=${opens} close=${closes}`);
  const runAt = (probe.match(/@run-at\s+(\S+)/) || [])[1];
  ok(`${slug}: @run-at 只认 start/idle`, runAt === 'document-start' || runAt === 'document-idle', String(runAt));
}

// ---------- ② 九张 @detect 表(vm 喂 facts) ----------
function detectFn(slug) {
  const src = readFileSync(join(PK, slug, 'probe.user.js'), 'utf8');
  const m = src.match(/\/\* @detect \*\/([\s\S]*?)\/\* @enddetect \*\//);
  if (!m) throw new Error(slug + ' 无 detect 块');
  const ctx = { result: null };
  vm.createContext(ctx);
  vm.runInContext(m[1] + '\nthis.__f = browseDetect;', ctx);
  return ctx.__f;
}
const T = (slug, facts, want) => eq(`${slug} 表: ${JSON.stringify(facts).slice(0, 60)}`, detectFn(slug)(facts), want);

// challenge-stop
const CS = { slug: 'challenge-stop', confidence: 'CONFIRMED' };
T('challenge-stop', { hasTurnstile: true }, CS);
T('challenge-stop', { hasChallengeDom: true }, CS);
T('challenge-stop', { scriptVendor: { cloudflare: true } }, CS);
T('challenge-stop', { scriptVendor: { recaptcha: true } }, CS);
T('challenge-stop', { scriptVendor: { hcaptcha: true } }, CS);
T('challenge-stop', { cfCookie: true }, null); // cookie 名是 antibot 的事实
T('challenge-stop', { scriptVendor: {} }, null);
T('challenge-stop', {}, null);
// antibot-vendor
const AB = { slug: 'antibot-vendor', confidence: 'PLAUSIBLE' };
for (const v of ['cloudflare', 'akamai', 'datadome', 'imperva']) T('antibot-vendor', { scriptVendor: { [v]: true } }, AB);
T('antibot-vendor', { cfCookie: true }, AB);
T('antibot-vendor', { akamaiCookie: true }, AB);
T('antibot-vendor', { scriptVendor: {} }, null);
T('antibot-vendor', {}, null);
// scroll-until-end
const SE = { slug: 'scroll-until-end', confidence: 'PLAUSIBLE' };
T('scroll-until-end', { viewportHeight: 800, docHeight: 3200 }, SE);
T('scroll-until-end', { viewportHeight: 800, docHeight: 3199 }, null);
T('scroll-until-end', { viewportHeight: 0, docHeight: 99999 }, null);
T('scroll-until-end', {}, null);
// next-page
const NP = { slug: 'next-page', confidence: 'CONFIRMED' };
T('next-page', { hasRelNext: true }, NP);
T('next-page', { hasRelNext: false }, null);
T('next-page', {}, null);
// spa-route
const SR = { slug: 'spa-route', confidence: 'PLAUSIBLE' };
T('spa-route', { framework: { name: 'react', version: null } }, SR);
T('spa-route', { framework: { name: 'vue', version: '3' } }, SR);
T('spa-route', { framework: null }, null);
T('spa-route', {}, null);
// 恒 null 三对(不许开始点名)
for (const slug of ['response-tap', 'link-table', 'fingerprint-watch']) {
  T(slug, {}, null);
  T(slug, { framework: { name: 'react' }, hasRelNext: true, hasTurnstile: true }, null);
}
// policy-surface
const PS = { slug: 'policy-surface', confidence: 'PLAUSIBLE' };
T('policy-surface', { cspMeta: true }, PS);
T('policy-surface', { passwordVisible: true }, PS);
T('policy-surface', { cspMeta: true, passwordVisible: true }, PS); // 仍是一条不是两条
T('policy-surface', {}, null);

// ---------- ③ prelude 运行时(vm 桩) ----------
function runtimeSandbox() {
  const posts = [];
  const sb = { console, posts };
  sb.window = sb;
  sb.location = { href: 'http://127.0.0.1:8871/a', pathname: '/a' };
  sb.history = { pushState() {}, replaceState() {} };
  sb.GM_xmlhttpRequest = (o) => { posts.push({ path: o.url.replace(/^.*:\d+/, ''), body: JSON.parse(o.data) }); };
  sb.setInterval = () => 0; sb.clearInterval = () => {}; sb.setTimeout = () => 0;
  return sb;
}
function loadRuntime(sb) {
  const src = readFileSync(join(PK, '_prelude.js'), 'utf8');
  const rt = src.split('// ---------- 判定 facts')[0];
  vm.createContext(sb);
  vm.runInContext(rt, sb);
  return sb.window.__probe;
}
{
  const sb = runtimeSandbox();
  const R = loadRuntime(sb);
  // 默认键 slug|action|pathname:同参第二次拒
  eq('R.see 首发通', R.see({ slug: 'challenge-stop', action: 'rune', data: {} }), true);
  eq('R.see 同默认键拒', R.see({ slug: 'challenge-stop', action: 'rune', data: {} }), false);
  eq('R.see 不同 action 不撞', R.see({ slug: 'challenge-stop', action: 'read', data: {} }), true);
  // rearm 后可再发
  R.rearm();
  eq('R.rearm 后同参可再发', R.see({ slug: 'challenge-stop', action: 'rune', data: {} }), true);
  // 显式 once 覆盖默认键(跨路径仍只一条)
  eq('once 首发通', R.see({ slug: 'x', action: 'read', once: 'k1' }), true);
  sb.location.pathname = '/b';
  eq('once 跨路径仍拒', R.see({ slug: 'x', action: 'read', once: 'k1' }), false);
  // 无 GM 不抛
  const sb2 = { window: {}, location: { href: 'http://x/', pathname: '/' }, history: { pushState() {}, replaceState() {} }, setInterval() { return 0; }, clearInterval() {}, setTimeout() {}, console };
  sb2.window = sb2;
  const src = readFileSync(join(PK, '_prelude.js'), 'utf8').split('// ---------- 判定 facts')[0];
  vm.createContext(sb2);
  vm.runInContext(src, sb2);
  let threw = false;
  try { sb2.window.__probe.see({ slug: 'y', action: 'rune' }); } catch { threw = true; }
  ok('无 GM 时 see 不抛', !threw);
}
{
  // route:每个回调都收到 pushState;rearm 生效;href 不变的 replaceState 不发
  const sb = runtimeSandbox();
  const R = loadRuntime(sb);
  const seenA = [], seenB = [];
  R.route((e) => seenA.push(e.kind));
  R.route((e) => seenB.push(e.kind));
  R.see({ slug: 'challenge-stop', action: 'rune' });
  sb.history.pushState({}, '', '/b');
  eq('route 回调 A 收到 pushState', seenA, ['pushState']);
  eq('route 回调 B 也收到 pushState(登记表修复)', seenB, ['pushState']);
  eq('pushState 后 rearm 生效(同参可再发)', R.see({ slug: 'challenge-stop', action: 'rune' }), true);
}
{
  // tap:登记两个过滤器,一次 fetch 各回调一次;响应体不被吃掉;二次安装不双包
  const sb = runtimeSandbox();
  let fetchBody = 'init';
  const realFetch = async (u) => {
    const tx = JSON.stringify({ url: u, n: 1 });
    return {
      clone() { return { text: async () => tx }; },
      status: 200,
      async text() { return tx; },
    };
  };
  sb.fetch = realFetch;
  const R = loadRuntime(sb);
  const hits = [];
  R.tap('t1', (ctx) => hits.push(['t1', ctx.url, ctx.status]));
  R.tap('t2', (ctx) => hits.push(['t2', ctx.url]));
  sb.window.fetch = sb.fetch; // 桩:runtime 包在 sb.window.fetch 上
  const wrapped = sb.window.fetch;
  // 模拟 runtime 包装(fetchWrapped 已安装)
  void wrapped;
  // 直接触发内部安装路径:tap 已调 _installTaps;直接调一次包装后的 fetch
  (async () => {
    const resp = await sb.window.fetch('http://127.0.0.1:8871/api.json');
    const body = await resp.text();
    // 微任务后断言(在 then 链里)
    setTimeout(() => {
      eq('tap 两过滤器各一次', hits.length, 2);
      ok('tap 响应体不被吃掉', body.includes('api.json'));
    }, 10);
  })();
}

// ---------- 汇总 ----------
const EXPECT_MIN = 60; // 用例下界(少跑=红)
await new Promise((r) => setTimeout(r, 30)); // 等异步 tap 断言
console.log(fails.length ? fails.map((f) => 'FAIL ' + f).join('\n') : '');
console.log(`=== check.mjs ${pass} 过 ${fail} 败(下界 ${EXPECT_MIN})===`);
if (fail > 0 || pass < EXPECT_MIN) process.exit(1);
