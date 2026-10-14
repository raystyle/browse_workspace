# next-page

翻页采集。`@detect` 在存在 `rel=next` 或相应 `aria-label` 时返回 CONFIRMED。没有下一页或页面签名不变则 `stop`。命中节点写入 `data-browse-next`、`data-browse-css`、`data-browse-xpath`。`mech.rn` 点击下一页，间隔 1.5s，上限 200 页；选择器未命中时按上述属性定位。源位于 `build/pairs/next-page/`。
