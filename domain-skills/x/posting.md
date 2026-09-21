# x：登录与发帖

## 登录

登录页用 `https://x.com/i/flow/login`（整版表单）；`https://x.com/` 首页可能只出截断版登录钮。

- Google 联登按钮走 FedCM（沙箱跨域 iframe 加浏览器级凭据弹窗）：CDP 派发的点击不算 trusted user gesture，自动化点它无效。要 Google 联登就请用户手点，等确认再继续
- 用户名密码流：问用户要凭据，别猜、别从截图读

## 发帖

登录后 `goto("https://x.com/home")`。compose 框是 contenteditable：

- 定位：`snapshot` 后按 role=textbox 挑（或 pageEval 查 `[data-testid="tweetTextarea_0"]`）；contenteditable 用 `typeRef` 逐键输入（fillRef 的 insertText 对富文本编辑器不可靠）
- 发送：`findRefs("Post")` 按 role=button 挑；inline 编辑器与弹层是不同 testid（见下表）
- 确认：成功后页面底部出「Your post was sent.」toast，`screenshot` 留证

## 稳定选择器（前代 bh 实测，按需复验）

| 元素 | data-testid |
| --- | --- |
| compose 框 | `tweetTextarea_0` |
| 发送钮（inline） | `tweetButtonInline` |
| 发送钮（弹层） | `tweetButton` |

## 坑

- twitter.com 全部重定向到 x.com：规范 URL 恒用 x.com
- Grok 侧栏意外弹出时，点左侧栏中性区收掉再操作 compose
- x.com 是 React 容器键面（goto 回执 framework 常报 react）：优先 AX 树（findRefs/snapshot），别写死 CSS 选择器
