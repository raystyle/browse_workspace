// challenge-stop 页内侧体(REQ-041 P1 件3 迁 SDK 编译道;源 page-skills 单件遗产,逻辑逐字)
// 垫底腿:见挑战选择器即 /userscript/stop 打断在跑的采集对 mech(一次即停)。
declare const GM_xmlhttpRequest: (o: Record<string, unknown>) => void;

(function () {
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var fired = false;
  function stop(data: Record<string, unknown>): void {
    if (fired) return; fired = true;
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'http://127.0.0.1:' + PORT + '/userscript/stop',
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ slug: 'challenge-stop', url: location.href, data: data })
    });
  }
  function check(): boolean {
    var el = document.querySelector('.cf-turnstile,#challenge-running,.cf-chl-running,.g-recaptcha,.h-captcha');
    if (el) {
      var vendor = el.className.indexOf('turnstile') >= 0 || el.className.indexOf('cf-') === 0 ? 'cloudflare'
        : (el.className.indexOf('recaptcha') >= 0 ? 'recaptcha' : 'hcaptcha');
      stop({ vendor: vendor, hint: 'selector' });
      return true;
    }
    return false;
  }
  if (!check()) {
    new MutationObserver(function () { check(); }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
