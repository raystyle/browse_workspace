"use strict";
(() => {
  // build/dompath.ts
  function cssEscape(ident) {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(ident);
    return ident.replace(/[^a-zA-Z0-9_-]/g, (ch) => "\\" + ch);
  }
  function cssPath(node) {
    if (!node || node.nodeType !== 1) return "";
    const doc = node.ownerDocument;
    const uniqueId = (el) => {
      if (!el.id || !doc) return "";
      const sel = "#" + cssEscape(el.id);
      try {
        if (doc.querySelectorAll(sel).length === 1) return sel;
      } catch {
        return "";
      }
      return "";
    };
    const hit = uniqueId(node);
    if (hit) return hit;
    const parts = [];
    let cur = node;
    while (cur && cur.nodeType === 1) {
      const idSel = uniqueId(cur);
      if (idSel) {
        parts.unshift(idSel);
        break;
      }
      const parent = cur.parentElement;
      if (!parent) {
        parts.unshift(cur.tagName.toLowerCase());
        break;
      }
      let idx = 1;
      let sib = parent.firstElementChild;
      while (sib && sib !== cur) {
        idx += 1;
        sib = sib.nextElementSibling;
      }
      parts.unshift(cur.tagName.toLowerCase() + ":nth-child(" + idx + ")");
      if (cur === doc.body) break;
      cur = parent;
    }
    return parts.join(" > ");
  }
  function xpath(node) {
    if (!node || node.nodeType !== 1) return "";
    if (node.id) return '//*[@id="' + node.id.replace(/"/g, "") + '"]';
    const parts = [];
    let cur = node;
    const doc = node.ownerDocument;
    while (cur && cur.nodeType === 1) {
      const parent = cur.parentElement;
      const name = cur.tagName.toLowerCase();
      if (!parent) {
        parts.unshift(name);
        break;
      }
      let same = 0;
      let idx = 0;
      let sib = parent.firstElementChild;
      while (sib) {
        if (sib.tagName === cur.tagName) {
          same += 1;
          if (sib === cur) idx = same;
        }
        sib = sib.nextElementSibling;
      }
      parts.unshift(same > 1 ? name + "[" + idx + "]" : name);
      if (doc && cur === doc.body) break;
      cur = parent;
    }
    return "//" + parts.join("/");
  }

  // build/pairs/next-page/probe.body.ts
  (function() {
    var PORT = (function() {
      var p = "%%BROWSE_PORT%%";
      return p.indexOf("%%") === 0 ? "9880" : p;
    })();
    var lastHtml = null;
    function pageSig() {
      var m = document.querySelector("main,[role=main],#content,.content") || document.body;
      return (m ? m.innerHTML.length : 0) + ":" + location.pathname;
    }
    function stop(data) {
      GM_xmlhttpRequest({
        method: "POST",
        url: "http://127.0.0.1:" + PORT + "/userscript/stop",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(Object.assign({ slug: "next-page", url: location.href }, { data }))
      });
    }
    function stamp(next) {
      next.setAttribute("data-browse-next", "1");
      var css = cssPath(next).slice(0, 300);
      var xp = xpath(next).slice(0, 300);
      if (css) next.setAttribute("data-browse-css", css);
      if (xp) next.setAttribute("data-browse-xpath", xp);
    }
    function check() {
      var next = document.querySelector('a[rel=next],[rel="next"],[aria-label="Next"],a[aria-label="next"],a.next,a[title="Next"]');
      if (next) stamp(next);
      var sig = pageSig();
      var samePage = lastHtml !== null && sig === lastHtml;
      lastHtml = sig;
      if (!next || next.disabled || next.getAttribute("aria-disabled") === "true") {
        stop({ reason: "no-next", sig });
        return true;
      }
      if (samePage) {
        stop({ reason: "empty-turn", sig });
        return true;
      }
      return false;
    }
    if (!check()) {
      new MutationObserver(function() {
        check();
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  })();
})();
