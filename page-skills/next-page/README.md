# next-page

翻页采集对(爬虫类)。`probe.user.js` 与 `mech.rn` 是生成物(`pnpm build`),源在 `build/pairs/next-page/`,勿手改。@detect 看 rel=next/aria-label 出 CONFIRMED;常驻腿
监听翻页后:没有下一页(或禁用)与空转(页面签名不变)即 stop
(data={reason,sig})。命中的下一页节点写 data-browse-next、data-browse-css、data-browse-xpath。
mech 循环点下一页(1.5s 等待,200 页帽);选择器落空后按这三项再找。
真导航(非 fetch-append)避免双份 DOM(素材:sharmanhall 的教训,X 检索轮)。
