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
export function tabNavParams(args: { plan: { urls: string[] }; k: number }): string {
  return JSON.stringify({ url: args.plan.urls[args.k] });
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
export function probeMissing(args: { plan: { probe: unknown } }): 0 | 1 {
  return args.plan.probe === null || args.plan.probe === undefined ? 1 : 0;
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
export function consentFinalize(args: { top: number; plan: { probe: unknown } }): string {
  return (async (): Promise<string> => {
    const getp = () => {
      try { return JSON.parse(document.documentElement.getAttribute('probe') || 'null'); } catch { return null; }
    };
    let p = args.plan.probe as { verdict?: string; results?: { url: string }[]; settled?: boolean } | null;
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
export function urlCount(args: { plan: { urls: string[] } }): number {
  return args.plan.urls.length;
}

/** targetId 直取(JSON 串形) */
export function targetIdOf(args: { r: { targetId?: string } }): string {
  return JSON.stringify(args.r.targetId);
}

/** currentTab 的 targetId(JSON 串形,null 安全) */
export function homeTargetId(args: { r: { targetId?: string } }): string {
  return JSON.stringify((args.r && args.r.targetId) || null);
}

/** 目标签提取:readystatechange-complete 事件等待(帽 pageComplete)+ 渲染内容 */
export function extractPage(args: { plan: { urls: string[] }; k: number }): string {
  return (async (): Promise<string> => {
    await new Promise<void>((resolve) => {
      if (document.readyState === 'complete') return resolve();
      const onr = () => {
        if (document.readyState === 'complete') { document.removeEventListener('readystatechange', onr); resolve(); }
      };
      document.addEventListener('readystatechange', onr);
      setTimeout(resolve, pageComplete);
    });
    return JSON.stringify({
      url: args.plan.urls[args.k],
      finalUrl: location.href,
      nav: /^https?:/.test(location.href) ? 'ok' : 'failed',
      title: document.title,
      ready: document.readyState,
      text: String((document.body && document.body.innerText) || '').slice(0, TEXT_pageText),
      html: document.documentElement.outerHTML.slice(0, TEXT_pageHtml),
    });
  })();
}

/** 收口:probe 面重读新鲜 attr(md/AI 补写早于访问完成)+ pages 合包 */
export function assemble(args: { plan: { probe: unknown }; pages: string }): string {
  const fresh = (() => {
    try { return JSON.parse(document.documentElement.getAttribute('probe') || 'null'); } catch { return null; }
  })();
  return JSON.stringify({
    probe: fresh || args.plan.probe,
    pages: JSON.parse('[' + args.pages + ']'),
    errors: args.plan.probe ? [] : [{ stage: 'probe', op: 'attr', message: 'probe attr 未现' }],
  });
}
