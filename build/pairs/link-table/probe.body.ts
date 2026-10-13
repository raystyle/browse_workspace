// link-table 页内侧体(REQ-041 P1 件3 迁 SDK;Katana 课:每条记下 css/xpath)
// 导出腿:去重收链接到页面主世界 __browseLinks.items(上限 3000)。
import { cssPath, xpath } from '../../dompath.ts';

declare const unsafeWindow: (Window & Record<string, unknown>) | undefined;

(function () {
  var PORT = (function () { var p = '%%BROWSE_PORT%%'; return p.indexOf('%%') === 0 ? '9880' : p; })();
  var page: Record<string, unknown> = (typeof unsafeWindow !== 'undefined' && unsafeWindow)
    ? (unsafeWindow as unknown as Record<string, unknown>)
    : (window as unknown as Record<string, unknown>);
  type Links = { seen: Record<string, 1>; count: number; items: { href: string; css: string; xpath: string }[] };
  var L = (page.__browseLinks as Links | undefined) || { seen: {}, count: 0, items: [] };
  if (!L.items) L.items = [];
  page.__browseLinks = L;
  function scan(): void {
    var as = document.querySelectorAll('a[href]');
    var cap = Math.min(as.length, 3000);
    for (var i = 0; i < cap; i++) {
      var a = as[i];
      var h = a.href;
      if (h && !L.seen[h]) {
        L.seen[h] = 1;
        L.count++;
        var css = cssPath(a).slice(0, 300);
        var xp = xpath(a).slice(0, 300);
        L.items.push({ href: h, css: css, xpath: xp });
        if (css) a.setAttribute('data-browse-css', css);
        if (xp) a.setAttribute('data-browse-xpath', xp);
      }
    }
  }
  scan();
  new MutationObserver(function () { scan(); }).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(function () {}, 10000);
})();
