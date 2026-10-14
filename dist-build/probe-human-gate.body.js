"use strict";
(() => {
  // build/pairs/human-gate/probe.body.ts
  (function() {
    var PORT = (function() {
      var p = "%%BROWSE_PORT%%";
      return p.indexOf("%%") === 0 ? "9880" : p;
    })();
    var fired = false;
    function signal(source) {
      if (fired) return;
      fired = true;
      document.documentElement.setAttribute("us-human-done", source);
      GM_xmlhttpRequest({
        method: "POST",
        url: "http://127.0.0.1:" + PORT + "/events",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ type: "see", slug: "human-gate", url: location.href, data: { source } })
      });
    }
    document.addEventListener("browse-human-arm", function(e) {
      var msg = e.detail && e.detail.message || "\u9700\u8981\u4EBA\u5DE5\u64CD\u4F5C";
      try {
        GM_notification({ title: "browse human-gate", text: msg, timeout: 0 });
      } catch (err) {
      }
      try {
        GM_registerMenuCommand("\u4EBA\u5DE5\u5B8C\u6210 \u2192 \u653E\u884C", function() {
          signal("menu");
        });
      } catch (err) {
      }
      document.documentElement.setAttribute("us-human-armed", "1");
    });
    document.addEventListener("browse-human-done", function() {
      signal("event");
    });
  })();
})();
