# JS 对话框

场景：confirm/prompt 拦路、表单提交弹窗、离开页确认。

- 状态：`dialogStatus()`（open/type/message/defaultPrompt）；接受 `dialogAccept(text?)`（prompt 可带应答文本）、拒绝 `dialogDismiss()`
- alert 与 beforeunload 会被自动接受，无需手动；要拦的是 confirm/prompt：触发动作后查 `dialogStatus()` 再处置
- `fillInput`/`fillRef` 的 submit 可能触发对话框或导航：先 `dialogStatus()` 分流，再 `goto()`/`waitLoad()` 收尾
- 事件面等开框：`waitFor("Page.javascriptDialogOpening")`；方言无并发，惯例形态是动作后轮询状态而非预订阅
- 大量 alert/confirm 的页面可打桩：`setInitScript` 覆写 window.alert/confirm/prompt 收进数组，事后 `pageEval` 读；代价：confirm 恒返 true、toString 可被反爬检测、处理不了 beforeunload；CDP 面（dialogAccept/dismiss）页面零 JS 运行，不可检测
