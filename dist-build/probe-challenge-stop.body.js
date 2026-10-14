"use strict";
(() => {
  // build/pairs/challenge-stop/probe.body.ts
  (function() {
    var PORT = (function() {
      var p = "%%BROWSE_PORT%%";
      return p.indexOf("%%") === 0 ? "9880" : p;
    })();
    var fired = false;
    function stop(data) {
      if (fired) return;
      fired = true;
      GM_xmlhttpRequest({
        method: "POST",
        url: "http://127.0.0.1:" + PORT + "/userscript/stop",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ slug: "challenge-stop", url: location.href, data })
      });
    }
    function check() {
      var el = document.querySelector(".cf-turnstile,#challenge-running,.cf-chl-running,.g-recaptcha,.h-captcha");
      if (el) {
        var vendor = el.className.indexOf("turnstile") >= 0 || el.className.indexOf("cf-") === 0 ? "cloudflare" : el.className.indexOf("recaptcha") >= 0 ? "recaptcha" : "hcaptcha";
        stop({ vendor, hint: "selector" });
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
