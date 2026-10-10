// build/mech.bodies.ts
function buildUrl(args) {
  void args.top;
  return "https://www.google.com/search?q=" + encodeURIComponent(args.q) + "&num=10";
}
function ping() {
  return 1;
}
function onSearch() {
  return location.pathname.indexOf("/search") === 0 ? 1 : 0;
}
function isSorry() {
  return location.pathname.indexOf("/sorry") === 0 ? 1 : 0;
}
function navParams(args) {
  return JSON.stringify({ url: args.u });
}
function tabNavParams(args) {
  return JSON.stringify({ url: args.plan.urls[args.k] });
}
function waitSettled(args) {
  void args;
  return (async () => {
    let guardN = 0;
    while (!(document.documentElement && document.documentElement.getAttribute)) {
      await new Promise((r) => setTimeout(r, 100));
      guardN++;
      if (guardN > Math.floor(3e3 / 100)) break;
    }
    const getp = () => {
      try {
        return JSON.parse(document.documentElement.getAttribute("probe") || "null");
      } catch {
        return null;
      }
    };
    const p = await new Promise((resolve) => {
      let done = false;
      const finish = (v) => {
        if (done) return;
        done = true;
        resolve(v);
      };
      const cur = getp();
      if (cur && cur.settled) return finish(cur);
      const mo = new MutationObserver(() => {
        const v = getp();
        if (v && v.settled) {
          mo.disconnect();
          finish(v);
        }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["probe"] });
      setTimeout(() => {
        mo.disconnect();
        finish(getp());
      }, 2e4);
    });
    const pr = p;
    return JSON.stringify({ probe: p, urls: pr && pr.results ? pr.results.map((r) => r.url) : [] });
  })();
}
function probeMissing(args) {
  return args.plan.probe === null || args.plan.probe === void 0 ? 1 : 0;
}
function reload() {
  location.reload();
  return 1;
}
function waitSettledReload() {
  return (async () => {
    let guard2 = 0;
    while (!(document.documentElement && document.documentElement.getAttribute)) {
      await new Promise((r) => setTimeout(r, 100));
      guard2++;
      if (guard2 > Math.floor(3e3 / 100)) break;
    }
    const getp2 = () => {
      try {
        return JSON.parse(document.documentElement.getAttribute("probe") || "null");
      } catch {
        return null;
      }
    };
    const p2 = await new Promise((resolve) => {
      let done2 = false;
      const finish2 = (v) => {
        if (done2) return;
        done2 = true;
        resolve(v);
      };
      const cur2 = getp2();
      if (cur2 && cur2.settled) return finish2(cur2);
      const mo2 = new MutationObserver(() => {
        const v2 = getp2();
        if (v2 && v2.settled) {
          mo2.disconnect();
          finish2(v2);
        }
      });
      mo2.observe(document.documentElement, { attributes: true, attributeFilter: ["probe"] });
      setTimeout(() => {
        mo2.disconnect();
        finish2(getp2());
      }, 15e3);
    });
    const pr = p2;
    return JSON.stringify({ probe: p2, urls: pr && pr.results ? pr.results.map((r) => r.url) : [] });
  })();
}
function consentFinalize(args) {
  return (async () => {
    const getp = () => {
      try {
        return JSON.parse(document.documentElement.getAttribute("probe") || "null");
      } catch {
        return null;
      }
    };
    let p = args.plan.probe;
    if (p && p.verdict === "consent") {
      const btns = document.querySelectorAll('#consent button, form[action*="consent"] button, div[role="dialog"] button');
      for (let bi = 0; bi < btns.length; bi++) {
        const t = String(btns[bi].textContent || btns[bi].getAttribute("aria-label") || "");
        if (/accept all|agree|accept/i.test(t)) {
          btns[bi].click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 2500));
      p = await new Promise((resolve) => {
        let done2 = false;
        const finish2 = (v) => {
          if (done2) return;
          done2 = true;
          resolve(v);
        };
        const cur2 = getp();
        if (cur2 && cur2.settled) return finish2(cur2);
        const mo2 = new MutationObserver(() => {
          const v2 = getp();
          if (v2 && v2.settled) {
            mo2.disconnect();
            finish2(v2);
          }
        });
        mo2.observe(document.documentElement, { attributes: true, attributeFilter: ["probe"] });
        setTimeout(() => {
          mo2.disconnect();
          finish2(getp());
        }, 15e3);
      });
    }
    const urls = p && p.results ? p.results.slice(0, Number(args.top)).map((r) => r.url) : [];
    return JSON.stringify({ probe: p, urls });
  })();
}
function urlCount(args) {
  return args.plan.urls.length;
}
function targetIdOf(args) {
  return JSON.stringify(args.r.targetId);
}
function homeTargetId(args) {
  return JSON.stringify(args.r && args.r.targetId || null);
}
function extractPage(args) {
  return (async () => {
    await new Promise((resolve) => {
      if (document.readyState === "complete") return resolve();
      const onr = () => {
        if (document.readyState === "complete") {
          document.removeEventListener("readystatechange", onr);
          resolve();
        }
      };
      document.addEventListener("readystatechange", onr);
      setTimeout(resolve, 12e3);
    });
    return JSON.stringify({
      url: args.plan.urls[args.k],
      finalUrl: location.href,
      nav: /^https?:/.test(location.href) ? "ok" : "failed",
      title: document.title,
      ready: document.readyState,
      text: String(document.body && document.body.innerText || "").slice(0, TEXT_pageText),
      html: document.documentElement.outerHTML.slice(0, TEXT_pageHtml)
    });
  })();
}
function assemble(args) {
  const fresh = (() => {
    try {
      return JSON.parse(document.documentElement.getAttribute("probe") || "null");
    } catch {
      return null;
    }
  })();
  return JSON.stringify({
    probe: fresh || args.plan.probe,
    pages: JSON.parse("[" + args.pages + "]"),
    errors: args.plan.probe ? [] : [{ stage: "probe", op: "attr", message: "probe attr \u672A\u73B0" }]
  });
}
export {
  assemble,
  buildUrl,
  consentFinalize,
  extractPage,
  homeTargetId,
  isSorry,
  navParams,
  onSearch,
  ping,
  probeMissing,
  reload,
  tabNavParams,
  targetIdOf,
  urlCount,
  waitSettled,
  waitSettledReload
};
