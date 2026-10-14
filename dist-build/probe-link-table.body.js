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

  // build/pairs/link-table/probe.body.ts
  (function() {
    var PORT = (function() {
      var p = "%%BROWSE_PORT%%";
      return p.indexOf("%%") === 0 ? "9880" : p;
    })();
    var page = typeof unsafeWindow !== "undefined" && unsafeWindow ? unsafeWindow : window;
    var L = page.__browseLinks || { seen: {}, count: 0, items: [] };
    if (!L.items) L.items = [];
    page.__browseLinks = L;
    function scan() {
      var as = document.querySelectorAll("a[href]");
      var cap = Math.min(as.length, 3e3);
      for (var i = 0; i < cap; i++) {
        var a = as[i];
        var h = a.href;
        if (h && !L.seen[h]) {
          L.seen[h] = 1;
          L.count++;
          var css = cssPath(a).slice(0, 300);
          var xp = xpath(a).slice(0, 300);
          L.items.push({ href: h, css, xpath: xp });
          if (css) a.setAttribute("data-browse-css", css);
          if (xp) a.setAttribute("data-browse-xpath", xp);
        }
      }
    }
    scan();
    new MutationObserver(function() {
      scan();
    }).observe(document.documentElement, { childList: true, subtree: true });
    setInterval(function() {
    }, 1e4);
  })();
})();
