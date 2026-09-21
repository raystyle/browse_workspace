# 元素引用表

场景：按语义找元素再动作，替代猜 CSS 选择器；token 预算紧的大页。

- ref 的唯一来源是 `snapshot()`（AX 树短 ref e1、e2…带 role/name/value/childIds）；检索用 `findRefs(query, {insensitive})`：服务端子串匹配，只回命中节点加祖先链（grep -C 式），比全量 snapshot 省一个量级 token
- findRefs 有命中才整表替换（同 snapshot 语义）；零命中保留旧表并标 kept_refs:true
- ref 在动作时重解析，不是记屏幕坐标：元素位移或被遮挡时 `clickRef` 拒绝并报遮挡物；页面导航后旧 ref 必失效（同文档 fragment 跳转除外），重新 snapshot
- 大页两段式：`snapshot({depth})` 浅扫定位区域，再 `snapshot(e34)` 部分展开省 token
- 检索范围是顶层 AX 树：iframe/shadow 内节点不在其中，先 `snapshot({pierce: true})`（同源 iframe 与 shadow 走 pierce，跨域 OOPIF 走子 session 合并，都进同一 ref 表）
- 找交互目标按 role 挑（button/checkbox/link），别拿文本节点：findRefs 按文本会同时命中容器与其 StaticText 子节点
- 与 domain-skills 互补：站点知识给结构，snapshot 给当下实时态
