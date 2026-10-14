// ==UserScript==
// @name         spa-route probe
// @match        *://*/*
// @connect      127.0.0.1
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==
/* @detect */
function browseDetect(facts) {
  if (facts.framework) {
    return { slug: 'spa-route', confidence: 'PLAUSIBLE' };
  }
  return null;
}
/* @enddetect */

"use strict";
(() => {
  // build/pairs/spa-route/probe.body.ts
  (function() {
    var page = typeof unsafeWindow !== "undefined" && unsafeWindow ? unsafeWindow : window;
    var hist = page.history;
    var PORT = (function() {
      var p = "%%BROWSE_PORT%%";
      return p.indexOf("%%") === 0 ? "9880" : p;
    })();
    var last = location.href;
    function report(type) {
      if (location.href === last && type !== "popstate") return;
      last = location.href;
      GM_xmlhttpRequest({
        method: "POST",
        url: "http://127.0.0.1:" + PORT + "/events",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ type: "see", slug: "spa-route", url: location.href, data: { kind: type } })
      });
    }
    function fan(kind) {
      report(kind);
      var hooks = page.__browseRouteHooks;
      if (!hooks) return;
      for (var i = 0; i < hooks.length; i++) {
        try {
          hooks[i]({ kind });
        } catch (e) {
        }
      }
    }
    function seal(name, fn) {
      try {
        Object.defineProperty(hist, name, { value: fn, writable: false, configurable: false });
      } catch (e) {
        try {
          hist[name] = fn;
        } catch (e2) {
        }
      }
    }
    var KEY = "__browseRouteWrapped";
    var desc;
    try {
      desc = Object.getOwnPropertyDescriptor(hist, "pushState");
    } catch (e) {
    }
    var sealed = !!(desc && desc.configurable === false);
    try {
      if (sealed) {
        if (!page.__browseSpaJoined) {
          page.__browseSpaJoined = true;
          var joined = page.__browseRouteHooks || [];
          page.__browseRouteHooks = joined;
          joined.push(function(e) {
            report(e && e.kind);
          });
        }
      } else if (!hist[KEY]) {
        var wp = hist.pushState.bind(hist);
        var wr = hist.replaceState.bind(hist);
        seal("pushState", function() {
          var r = wp.apply(hist, arguments);
          fan("pushState");
          return r;
        });
        seal("replaceState", function() {
          var r = wr.apply(hist, arguments);
          fan("replaceState");
          return r;
        });
        try {
          Object.defineProperty(hist, KEY, { value: true });
        } catch (e) {
        }
      }
    } catch (e) {
    }
    page.addEventListener("popstate", function() {
      report("popstate");
    });
    page.addEventListener("hashchange", function() {
      report("hashchange");
    });
  })();
})();
