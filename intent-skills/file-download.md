# 文件上传与下载

场景：带附件表单、导出报表类站点。

- 上传：`dropFiles(ref, [绝对路径…])`（DOM.setFileInputFiles 直灌，multiple 支持，路径预检不存在即报错）；路径是 daemon 侧的文件系统
- 绝不在 file input 上模拟点击：OS 文件选择器会打开而 CDP 关不掉；隐藏 input（display:none/屏幕外）不受可见性影响，直接找 ref 灌，别点样式化按钮
- 无 input 的纯 dropzone：先 pageEval 查 `document.querySelectorAll('input[type=file]')` 找隐藏 input（无障碍考虑多保留一个）；真没有才合成 DataTransfer 的 drop 事件序列（pageEval，可被反爬检测，下策）
- 验证上传已触发：`waitForResponse` 看上传 POST；截图往往看不出文件已附加
- 下载触发：导航型下载的回执是 `net::ERR_ABORTED`（导航让位下载，正常信号）：裸调 `Page.navigate`，不要用 goto（会当失败报）
- 下载行情：`downloads({since})`（guid/url/filename/state/bytes）；落盘：`downloadPath(guid, timeoutS)` 等 completed 给路径；落盘目录内建状态目录 downloads/（捕获随 tab 入口自动开，无需自设下载行为）
- 内联导航型「下载」（页内 PDF 查看器）没有 downloadWillBegin：改 `pdf()` 存档或 `browse fetch` 取文
- 普通 HTTP GET 且不依赖登录态的下载可 `browse fetch`/裸 fetch 绕开浏览器（快一个量级）；会丢 cookie 认证，要登录的下载走浏览器路径
- 测试通道：`routeMock(pattern, body, {headers: {"Content-Disposition": "attachment; filename=x.txt"}})` 触发真下载（#38）
- begin 事件与导航回执有竞速：垫一拍轮询再查 downloads()
