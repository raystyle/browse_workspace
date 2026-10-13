# link-table

链接清单导出对(爬虫类)。常驻腿扫 a[href] 进 Set 去重(3000 帽,MutationObserver
持续增量),每条记下 href 与 css/xpath,并写在锚点的 data-browse-css /
data-browse-xpath 上。清单放页面主世界的 __browseLinks.items。mech 复用滚动驱动,
停后导出 items;旧页没有 items 时仍回 URL 数组。摘要不进环
(清单可能大,rune 返回值是导出面)。素材:@quellhorst 虚拟滚动收集 URL 的
思路(X 检索轮,仅思路无许可证成品)。源 `build/pairs/link-table/`,产物勿手改。
