# 多 tab 纪律

场景：开新页办事、多页面对照、用完收割。

- 开：`newTab(url?)`（内部先 about:blank 再 goto，防竞速假完成；带 url 时等加载预算 15 秒与 goto 缺省对齐）
- 列：`listPageTargets()`（带 own 标：只有 own=true 可 closeTab）；当前：`currentTab()`（无活动返回 null）
- 切：`switchTab(targetId)` 只改 CDP 活动路由，不动 Chrome 可见前景（人机共存不抢前台）
- 关：`closeTab(targetId)` 守卫只放行自建 tab（chrome 初始页与用户 tab 拒绝）；批量收割遍历 own=true 逐个关
- 要 Chrome 画面可见切前：`session.call("Target.activateTarget", {targetId})`（与 switchTab 相互独立，两个动作两件事）
- CLI 面：`browse --new-tab '<片段>'` 求值前先开新 tab
- 陷阱：Target.getTargets 返回顺序任意，不等于标签条可见顺序：按 url/title 认 tab，别信序；后台 tab 的 Input 可能挂起（见 mouse-input.md）
