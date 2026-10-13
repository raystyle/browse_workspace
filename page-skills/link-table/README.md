# link-table

扫 `a[href]` 去重,上限 3000。每条 `{href, css, xpath}`,并写到锚点 `data-browse-css` / `data-browse-xpath`。清单在 `__browseLinks.items`。mech 滚动后导出 items;没有 items 时导出 URL 数组。源 `build/pairs/link-table/`。
