// mech.bodies.ts — mech.rn 内嵌 JS 体的 TS 源(逐体 esbuild 打包注入 rune 模板槽)
// 每个导出 = 一个 cdp::js 求值体;签名即契约(args 形与返回形)。
// 编译器即 lint:类型错/语法错在 build 期红,不再运行期轮番踩。
// 常量走 build.mts esbuild define(裸名替换,运行期自包含);契约唯一权威 build/contracts.ts
declare const docElementGuard: string;
declare const settleAwait: string;
declare const reloadSettleAwait: string;
declare const consentReawait: string;
declare const commitPollTick: string;
declare const commitPollTries: string;
declare const pageComplete: string;
declare const aiStable: string;
declare const aiDeadline: string;
declare const transientRetryMs: string;
declare const followBeat: string;
declare const followDeadline: string;
declare const followBudget: string;
declare const tierSnippet: string;
declare const snippet: string;
declare const pageText: string;
declare const pageHtml: string;
declare const aiText: string;
declare const mdPage: string;
declare const mdHtmlIn: string;

/** 构建 SERP URL(注入安全:encodeURIComponent) */
export function buildUrl(args: { q: string; top: number }): string {
  void args.top;
  return 'https://www.google.com/search?q=' + encodeURIComponent(args.q) + '&num=10';
}

/** 会话探活 */
export function ping(): number {
  return 1;
}

/** 提交探测:当前页是否已是 SERP(pathname 判,防 /sorry?continue=…/search… 参数误命中) */
export function onSearch(): 0 | 1 {
  return location.pathname.indexOf('/search') === 0 ? 1 : 0;
}

/** 挑战页判读:google /sorry(限流/反爬)终态 */
export function isSorry(): 0 | 1 {
  return location.pathname.indexOf('/sorry') === 0 ? 1 : 0;
}

/** 导航参数构造(JSON 对象串) */
export function navParams(args: { u: string }): string {
  return JSON.stringify({ url: args.u });
}

/** 目标签导航参数构造 */
export function tabNavParams(args: { plan: unknown; k: number }): string {
  const plan = typeof args.plan === 'string' ? JSON.parse(args.plan) : args.plan;
  return JSON.stringify({ url: plan.urls[args.k] });
}

/** 段A-1:文档守卫 + settled 等待(事件驱动观察器,帽 settleAwait) */
export function waitSettled(args: { top: number }): string {
  void args;
  return (async (): Promise<string> => {
    let guardN = 0;
    while (!(document.documentElement && document.documentElement.getAttribute)) {
      await new Promise<void>((r) => setTimeout(r, 100));
      guardN++;
      if (guardN > Math.floor(docElementGuard / 100)) break;
    }
    const getp = () => {
      try { return JSON.parse(document.documentElement.getAttribute('probe') || 'null'); } catch { return null; }
    };
    const p = await new Promise<unknown>((resolve) => {
      let done = false;
      const finish = (v: unknown) => { if (done) return; done = true; resolve(v); };
      const cur = getp();
      if (cur && (cur as { settled?: boolean }).settled) return finish(cur);
      const mo = new MutationObserver(() => {
        const v = getp();
        if (v && (v as { settled?: boolean }).settled) { mo.disconnect(); finish(v); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['probe'] });
      setTimeout(() => { mo.disconnect(); finish(getp()); }, settleAwait);
    });
    const pr = p as { results?: { url: string }[] } | null;
    return JSON.stringify({ probe: p, urls: pr && pr.results ? pr.results.map((r) => r.url) : [] });
  })();
}

/** probe 缺席判定(0 = 缺席需自愈) */
export function probeMissing(args: { plan: unknown }): 0 | 1 {
  // 通道传 JSON 字符串,类型面是对象——先解(通道诚实:args.plan 恒串,勿再类型化直取)
  const plan = typeof args.plan === 'string' ? JSON.parse(args.plan) : args.plan;
  return plan.probe === null || plan.probe === undefined ? 1 : 0;
}

/** 刷新自愈:reload 必须独立求值(导航销毁当前求值上下文) */
export function reload(): number {
  location.reload();
  return 1;
}

/** 段A-1'(刷新后重等,帽 reloadSettleAwait) */
export function waitSettledReload(): string {
  return (async (): Promise<string> => {
    let guard2 = 0;
    while (!(document.documentElement && document.documentElement.getAttribute)) {
      await new Promise<void>((r) => setTimeout(r, 100));
      guard2++;
      if (guard2 > Math.floor(docElementGuard / 100)) break;
    }
    const getp2 = () => {
      try { return JSON.parse(document.documentElement.getAttribute('probe') || 'null'); } catch { return null; }
    };
    const p2 = await new Promise<unknown>((resolve) => {
      let done2 = false;
      const finish2 = (v: unknown) => { if (done2) return; done2 = true; resolve(v); }
      const cur2 = getp2();
      if (cur2 && (cur2 as { settled?: boolean }).settled) return finish2(cur2);
      const mo2 = new MutationObserver(() => {
        const v2 = getp2();
        if (v2 && (v2 as { settled?: boolean }).settled) { mo2.disconnect(); finish2(v2); }
      });
      mo2.observe(document.documentElement, { attributes: true, attributeFilter: ['probe'] });
      setTimeout(() => { mo2.disconnect(); finish2(getp2()); }, reloadSettleAwait);
    });
    const pr = p2 as { results?: { url: string }[] } | null;
    return JSON.stringify({ probe: p2, urls: pr && pr.results ? pr.results.map((r) => r.url) : [] });
  })();
}

/** 段A-2:consent 处置与终 plan(urls 截 top) */
export function consentFinalize(args: { top: number; plan: unknown }): string {
  return (async (): Promise<string> => {
    const plan = typeof args.plan === 'string' ? JSON.parse(args.plan) : args.plan;
    const getp = () => {
      try { return JSON.parse(document.documentElement.getAttribute('probe') || 'null'); } catch { return null; }
    };
    let p = plan.probe as { verdict?: string; results?: { url: string }[]; settled?: boolean } | null;
    if (p && p.verdict === 'consent') {
      const btns = document.querySelectorAll('#consent button, form[action*="consent"] button, div[role="dialog"] button');
      for (let bi = 0; bi < btns.length; bi++) {
        const t = String(btns[bi].textContent || btns[bi].getAttribute('aria-label') || '');
        if (/accept all|agree|accept/i.test(t)) { (btns[bi] as HTMLElement).click(); break; }
      }
      await new Promise<void>((r) => setTimeout(r, 2500));
      p = await new Promise((resolve) => {
        let done2 = false;
        const finish2 = (v: unknown) => { if (done2) return; done2 = true; resolve(v); }
        const cur2 = getp() as typeof p;
        if (cur2 && cur2.settled) return finish2(cur2);
        const mo2 = new MutationObserver(() => {
          const v2 = getp() as typeof p;
          if (v2 && v2.settled) { mo2.disconnect(); finish2(v2); }
        });
        mo2.observe(document.documentElement, { attributes: true, attributeFilter: ['probe'] });
        setTimeout(() => { mo2.disconnect(); finish2(getp()); }, consentReawait);
      });
    }
    const urls = p && p.results ? p.results.slice(0, Number(args.top)).map((r) => r.url) : [];
    return JSON.stringify({ probe: p, urls });
  })();
}

/** plan 的 urls 条数 */
export function urlCount(args: { plan: unknown }): number {
  const plan = typeof args.plan === 'string' ? JSON.parse(args.plan) : args.plan;
  return plan.urls.length;
}

/** follow 导航预算闸(REQ-041 P1 件2):urls 条数超预算(1 SERP+≤followBudget goto)返 1,mech 据此原子回执 */
export function budgetOver(args: { plan: unknown }): 0 | 1 {
  const plan = typeof args.plan === 'string' ? JSON.parse(args.plan) : args.plan;
  return plan.urls.length > Number(followBudget) ? 1 : 0;
}

/** follow 预算熔断回执(P1 件2):SERP 已收面保全进 probe 形,verdict=budget 不假绿。
 * 全 ProbePayload 形(MechOutput zod 可验;SERP results 原样保全,富集面 budget 形如实置空)。 */
export function budgetReceipt(args: { plan: unknown }): string {
  const plan = typeof args.plan === 'string' ? JSON.parse(args.plan) : args.plan;
  const p = plan.probe as { url?: string; title?: string; results?: unknown[] } | null;
  return JSON.stringify({
    slug: 'google-search',
    v: 'follow-budget',
    verdict: 'budget',
    drift: 'none',
    mainHits: 0,
    fallbackHits: 0,
    results: p && p.results ? p.results : [],
    url: p && p.url ? p.url : location.href,
    title: p && p.title ? p.title : '',
    ts: Date.now(),
    settled: false,
    markdown: null,
    tiers: null,
    converter: 'budget',
    ai_overview: { present: false, text: null },
    probe_debug: [],
  });
}

/** targetId 直取(JSON 串形) */
export function targetIdOf(args: { r: { targetId?: string } }): string {
  return JSON.stringify(args.r.targetId);
}

/** currentTab 的 targetId(JSON 串形,null 安全) */
export function homeTargetId(args: { r: { targetId?: string } }): string {
  return JSON.stringify((args.r && args.r.targetId) || null);
}

/** 目标签提取:readystatechange-complete 事件等待(帽 pageComplete)+ 渲染内容 + 页级三档(P1 件1:snippet 档,未做 md 转换 highlights 空 main null 如实) */
export function extractPage(args: { plan: unknown; k: number }): string {
  const plan = typeof args.plan === 'string' ? JSON.parse(args.plan) : args.plan;
  return (async (): Promise<string> => {
    await new Promise<void>((resolve) => {
      if (document.readyState === 'complete') return resolve();
      const onr = () => {
        if (document.readyState === 'complete') { document.removeEventListener('readystatechange', onr); resolve(); }
      };
      document.addEventListener('readystatechange', onr);
      setTimeout(resolve, pageComplete);
    });
    const text = String((document.body && document.body.innerText) || '');
    return JSON.stringify({
      url: plan.urls[args.k],
      finalUrl: location.href,
      nav: /^https?:/.test(location.href) ? 'ok' : 'failed',
      title: document.title,
      ready: document.readyState,
      text: text.slice(0, pageText),
      html: document.documentElement.outerHTML.slice(0, pageHtml),
      tiers: { snippet: text.replace(/\s+/g, ' ').trim().slice(0, Number(tierSnippet)), highlights: [], main: null },
    });
  })();
}

/** follow 段提取(REQ-041 P1 件2):结果页内容两拍稳——连续两次读值相同才收。
 * 三要素自查:事件源=beat 计时采样读内容签名(innerText 长+title 长+href;页面内容变化无 DOM
 * 事件可等,与前段 SERP 指纹稳引擎同族的采样判据),连续两拍同值即收;帽=followDeadline 硬帽,
 * readystate complete 只进出参证据(ready 字段)不提前收;原子错=签名读值 try/catch 包裹,
 * eval 级错由 mech 重试道兜,超帽仍带已渲染内容出参(stable:false 如实)。 */
export function extractPageStable(args: { plan: unknown; k: number }): string {
  const plan = typeof args.plan === 'string' ? JSON.parse(args.plan) : args.plan;
  return (async (): Promise<string> => {
    const sig = (): string => {
      try {
        return String((document.body && document.body.innerText) || '').length + ':' + String(document.title || '').length + ':' + location.href;
      } catch {
        return 'eval-err';
      }
    };
    const deadline = Date.now() + followDeadline;
    let prev: string | null = null;
    let beats = 0;
    let stable = false;
    while (Date.now() < deadline) {
      await new Promise<void>((r) => setTimeout(r, followBeat));
      beats++;
      const cur = sig();
      if (cur !== 'eval-err' && cur === prev) { stable = true; break; }
      prev = cur;
    }
    const text = String((document.body && document.body.innerText) || '');
    return JSON.stringify({
      url: plan.urls[args.k],
      finalUrl: location.href,
      nav: /^https?:/.test(location.href) ? 'ok' : 'failed',
      title: document.title,
      ready: document.readyState,
      stable,
      beats,
      text: text.slice(0, pageText),
      html: document.documentElement.outerHTML.slice(0, pageHtml),
      tiers: { snippet: text.replace(/\s+/g, ' ').trim().slice(0, Number(tierSnippet)), highlights: [], main: null },
    });
  })();
}

/** 收口:probe 面重读新鲜 attr(md/AI 补写早于访问完成)+ pages 合包 */
export function assemble(args: { plan: unknown; pages: string }): string {
  const plan = typeof args.plan === 'string' ? JSON.parse(args.plan) : args.plan;
  const fresh = (() => {
    try { return JSON.parse(document.documentElement.getAttribute('probe') || 'null'); } catch { return null; }
  })();
  return JSON.stringify({
    probe: fresh || plan.probe,
    pages: JSON.parse('[' + args.pages + ']'),
    errors: plan.probe ? [] : [{ stage: 'probe', op: 'attr', message: 'probe attr 未现' }],
  });
}
