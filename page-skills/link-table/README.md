# link-table

收集 `a[href]` 并去重，上限 3000 条。每条为 `{href, css, xpath}`，并写入锚点的 `data-browse-css` 与 `data-browse-xpath`。清单保存在 `__browseLinks.items`。`mech.rn` 滚动后导出 `items`；若不存在 `items` 则导出 URL 数组。源位于 `build/pairs/link-table/`。
