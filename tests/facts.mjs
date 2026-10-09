#!/usr/bin/env node
// facts.mjs — _prelude.js 判定 facts 游走的 jsdom 黄金子集(grok 测试方案 §5)
// 只锁 jsdom 算得准的字段(无布局:passwordVisible/docHeight 不在此测,归真页)。
// 用法:node tests/facts.mjs(需 devDependencies jsdom)
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRELUDE = readFileSync(join(ROOT, 'page-skills', '_prelude.js'), 'utf8');
const FACTS = PRELUDE.split('// ---------- 判定 facts')[1].split('\n').slice(1).join('\n'); // 首行是注释尾,剔掉

let pass = 0, fail = 0;
const fails = [];
function eq(name, got, want) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) pass++;
  else { fail++; fails.push(`${name} :: got ${g} want ${w}`); }
}

/// 在 jsdom 页面上跑 facts 段,返回 facts 对象
function factsOf(html, setup) {
  const dom = new JSDOM(html, { url: 'http://127.0.0.1:8871/' });
  const w = dom.window;
  if (setup) setup(w);
  // 裸全局(window 属性在 vm ctx 不是隐式可见):NodeFilter 供游走段
  const ctx = { window: w, document: w.document, facts: {}, NodeFilter: w.NodeFilter };
  vm.createContext(ctx);
  vm.runInContext(FACTS, ctx);
  return ctx.facts;
}

// 空 body:全假,无 framework
{
  const f = factsOf('<html><body></body></html>');
  eq('空页 hasTurnstile', f.hasTurnstile, false);
  eq('空页 hasChallengeDom', f.hasChallengeDom, false);
  eq('空页 hasRelNext', f.hasRelNext, false);
  eq('空页 cspMeta', f.cspMeta, false);
  eq('空页 framework 不出现', 'framework' in f, false);
}
// 挑战选择器
{
  const f = factsOf('<html><body><div class="cf-turnstile"></div><div id="challenge-running"></div></body></html>');
  eq('挑战页 hasTurnstile', f.hasTurnstile, true);
  eq('挑战页 hasChallengeDom', f.hasChallengeDom, true);
}
// scriptVendor 与 60 上限
{
  const mk = (n, srcFirst) => {
    let s = '';
    for (let i = 0; i < n; i++) s += `<script src="${srcFirst ? 'https://challenges.cloudflare.com/x.js' : 'https://ok' + i + '.example/x.js'}"></script>`;
    return `<html><body>${s}</body></html>`;
  };
  const f1 = factsOf(mk(3, true));
  eq('scriptVendor.cloudflare', f1.scriptVendor.cloudflare, true);
  const fAk = factsOf('<html><body><script src="https://x.akamai.com/a.js"></script></body></html>');
  eq('scriptVendor.akamai', fAk.scriptVendor.akamai, true);
  const fImp = factsOf('<html><body><script src="https://y.imperva.co/b.js"></script></body></html>');
  eq('scriptVendor.imperva', fImp.scriptVendor.imperva, true);
  // 61 个脚本:第 61 个(cloudflare)不被看(上限 60)
  const f61 = factsOf(mk(61, false).replace('src="https://ok60.example/x.js"', 'src="https://challenges.cloudflare.com/late.js"'));
  eq('scriptVendor 60 上限(第 61 个不看)', f61.scriptVendor.cloudflare, false); // 六键恒在,未命中是 false
}
// cookie 名(只放名字;值不进 facts)
{
  const f = factsOf('<html><body></body></html>', (w) => {
    Object.defineProperty(w.document, 'cookie', { get: () => '__cf_bm=zzz; other=1' });
  });
  eq('cfCookie', f.cfCookie, true);
  eq('akamaiCookie', f.akamaiCookie, false);
}
// rel=next
{
  const f = factsOf('<html><body><a rel="next" href="/p2">n</a></body></html>');
  eq('hasRelNext', f.hasRelNext, true);
}
// CSP meta
{
  const f = factsOf('<html><head><meta http-equiv="Content-Security-Policy" content="default-src x"></head><body></body></html>');
  eq('cspMeta', f.cspMeta, true);
}
// vue 全局
{
  const f = factsOf('<html><body></body></html>', (w) => { w.__vue_app__ = { version: '3.5' }; });
  eq('framework.name=vue', f.framework && f.framework.name, 'vue');
  eq('framework.version=3.5', f.framework && f.framework.version, '3.5');
}
// TreeWalker 800 封顶:标记在第 800 个内 vs 第 801 个
{
  const mk = (pos) => {
    let s = '';
    for (let i = 1; i <= 801; i++) s += `<span${i === pos ? ' data-reactFiber$="x"' : ''}>.</span>`;
    return `<html><body>${s}</body></html>`;
  };
  // jsdom:expando 属性经 setAttribute 变属性节点,Object.getOwnPropertyNames 不见——改用真实 expando
  const fIn = factsOf('<html><body></body></html>', (w) => {
    const b = w.document.body;
    for (let i = 1; i <= 801; i++) {
      const el = w.document.createElement('span');
      if (i === 700) el['__reactFiber$x'] = 1; // html/head/body 先吃 3 位,700 号稳在预算内
      b.appendChild(el);
    }
  });
  eq('游走预算内 react 可见', fIn.framework && fIn.framework.name, 'react');
  const fOut = factsOf('<html><body></body></html>', (w) => {
    const b = w.document.body;
    for (let i = 1; i <= 801; i++) {
      const el = w.document.createElement('span');
      if (i === 801) el['__reactFiber$x'] = 1;
      b.appendChild(el);
    }
  });
  eq('801 处 react 不可见(游走封顶)', fOut.framework, undefined);
}

console.log(fails.length ? fails.map((x) => 'FAIL ' + x).join('\n') : '');
console.log(`=== facts.mjs ${pass} 过 ${fail} 败 ===`);
process.exit(fail ? 1 : 0);
