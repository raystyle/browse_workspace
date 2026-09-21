# 页面存 PDF

场景：发票/报表落档、打印版内容留证。

- 基础：`pdf(path?)` 回 {path,bytes}；仅无头 chrome（有头会报错：先 down 再 up --headless，或改用 screenshot）
- 全参数（printBackground、页宽高与边距、landscape、pageRanges、scale、headerTemplate/footerTemplate）：`session.call("Page.printToPDF", {...})`
- 站点「打印」按钮会弹 OS 打印对话框，CDP 够不到：`setInitScript` 把 window.print 打桩成 no-op 再自己 pdf()；或找按钮背后的打印版 URL（常形如 ?print=1）直接 goto 后 pdf()
- 陷阱：printBackground 缺省 false，发票/收据类不开会一片空白；PDF 渲染走 @media print 样式（print 下 display:none 的元素不出现），要屏幕版观感先 `emulateMedia` 覆写媒质；超大页面可能触 Chrome 内部 PDF 尺寸限制静默失败，用 pageRanges 分段或减小 scale；字体取系统字体，webfont 未加载完会回退
