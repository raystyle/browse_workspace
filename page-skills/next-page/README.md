# next-page

翻页。`@detect` 看 rel=next/aria-label,出 CONFIRMED。没有下一页或页签名不变则 stop。命中节点写 `data-browse-next`、`data-browse-css`、`data-browse-xpath`。mech 点下一页,1.5s/步,200 页帽;选择器落空后按这三项再找。源 `build/pairs/next-page/`。
