// facts.ts — _prelude.js 判定 facts 游走的 jsdom 黄金子集(grok 方案 §5;TS+zod)
// 只锁 jsdom 算得准的字段(无布局:passwordVisible/docHeight 归真页)。
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { Tally, FactsShape, type Facts } from './lib.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRELUDE = readFileSync(join(ROOT, 'page-skills', '_prelude.js'), 'utf8');
// 首行是 split 标记的注释尾,剔掉
const FACTS = PRELUDE.split('// ---------- 判定 facts')[1]!.split('\n').slice(1).join('\n');
const t = new Tally();

/** 在 jsdom 页面上跑 facts 段,经 zod FactsShape 收口后返回 */
function factsOf(html: string, setup?: (w: typeof JSDOM.prototype.window) => void): Facts {
  const dom = new JSDOM(html, { url: 'http://127.0.0.1:8871/' });
  const w = dom.window;
  setup?.(w);
  // 裸全局(window 属性在 vm ctx 不隐式可见):NodeFilter 供游走段
  const ctx: Record<string, unknown> = { window: w, document: w.document, facts: {}, NodeFilter: w.NodeFilter };
  vm.createContext(ctx);
  vm.runInContext(FACTS, ctx);
  return t.parses('facts 骨架合法', FactsShape, ctx.facts);
}

// 空 body:全假,无 framework
{
  const f = factsOf('<html><body></body></html>');
  t.eq('空页 hasTurnstile', f.hasTurnstile, false);
  t.eq('空页 hasChallengeDom', f.hasChallengeDom, false);
  t.eq('空页 hasRelNext', f.hasRelNext, false);
  t.eq('空页 cspMeta', f.cspMeta, false);
  t.eq('空页 framework 不出现', 'framework' in f, false);
}
// 挑战选择器
{
  const f = factsOf('<html><body><div class="cf-turnstile"></div><div id="challenge-running"></div></body></html>');
  t.eq('挑战页 hasTurnstile', f.hasTurnstile, true);
  t.eq('挑战页 hasChallengeDom', f.hasChallengeDom, true);
}
// scriptVendor 与 60 上限
{
  const mk = (n: number, cloudflareFirst: boolean): string => {
    let s = '';
    for (let i = 0; i < n; i++) {
      s += `<script src="${cloudflareFirst ? 'https://challenges.cloudflare.com/x.js' : `https://ok${i}.example/x.js`}"></script>`;
    }
    return `<html><body>${s}</body></html>`;
  };
  t.eq('scriptVendor.cloudflare', factsOf(mk(3, true)).scriptVendor?.cloudflare, true);
  t.eq('scriptVendor.akamai', factsOf('<html><body><script src="https://x.akamai.com/a.js"></script></body></html>').scriptVendor?.akamai, true);
  t.eq('scriptVendor.imperva', factsOf('<html><body><script src="https://y.imperva.co/b.js"></script></body></html>').scriptVendor?.imperva, true);
  // 61 个脚本:第 61 个(cloudflare)不被看(上限 60);六键恒在,未命中是 false
  const f61 = factsOf(mk(61, false).replace('src="https://ok60.example/x.js"', 'src="https://challenges.cloudflare.com/late.js"'));
  t.eq('scriptVendor 60 上限(第 61 个不看)', f61.scriptVendor?.cloudflare, false);
}
// cookie 名(只放名字;值不进 facts)
{
  const f = factsOf('<html><body></body></html>', (w) => {
    Object.defineProperty(w.document, 'cookie', { get: () => '__cf_bm=zzz; other=1' });
  });
  t.eq('cfCookie', f.cfCookie, true);
  t.eq('akamaiCookie', f.akamaiCookie, false);
}
// rel=next / CSP meta
t.eq('hasRelNext', factsOf('<html><body><a rel="next" href="/p2">n</a></body></html>').hasRelNext, true);
t.eq(
  'cspMeta',
  factsOf('<html><head><meta http-equiv="Content-Security-Policy" content="default-src x"></head><body></body></html>').cspMeta,
  true,
);
// vue 全局
{
  const f = factsOf('<html><body></body></html>', (w) => {
    (w as unknown as Record<string, unknown>).__vue_app__ = { version: '3.5' };
  });
  t.eq('framework.name=vue', f.framework?.name, 'vue');
  t.eq('framework.version=3.5', f.framework?.version, '3.5');
}
// TreeWalker 800 封顶:标记 700 号(界内,html/head/body 先吃 3 位)vs 801 号(界外)
{
  const walk = (markAt: number): Facts =>
    factsOf('<html><body></body></html>', (w) => {
      const b = w.document.body;
      for (let i = 1; i <= 801; i++) {
        const el = w.document.createElement('span');
        if (i === markAt) (el as unknown as Record<string, unknown>)['__reactFiber$x'] = 1;
        b.appendChild(el);
      }
    });
  t.eq('游走预算内 react 可见', walk(700).framework?.name, 'react');
  t.eq('801 处 react 不可见(游走封顶)', walk(801).framework, undefined);
}

process.exit(t.summary('facts.ts', 19));
