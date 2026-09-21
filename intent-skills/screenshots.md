# 截图

场景：探索（写选择器前先看一眼页面上有什么）、验证（操作后像素取证）。

- 基础：`screenshot(path?, full?)` 回 {path,bytes,skipped}；opts.format png/jpeg、quality（jpeg 1-100 缺省 80，比 png 省约五倍，肉眼核对够用）
- 去重轮询：opts.ifChanged 与既有文件逐字节相同即 skipped（省读回不省拍摄；字节可比性限同一引擎二进制）
- 元素级：opts.ref 截该元素 bbox（不用自己算 BoxModel）；opts.hires/scale 高倍采样
- 取证标注：`annotate(refs)` 批量画框加编号徽标（与 snapshot 编号天然对齐）、`highlight(ref, {label})` 持久橙框不挡点击；完场 `highlightClear()`
- 陷阱：full 走超视口拼接会触发重布局（resize），用户在看的流程中途别用，改视口截图；fixed/sticky 页头拼接图像里可能重复出现；高 DPI 下截图是设备像素，从图上目测的坐标要除 devicePixelRatio 才是 CSS 点击坐标；导航后紧接截图的提交窗竞速 host 层已统一等提交（#34），Not attached 有界重试内建
