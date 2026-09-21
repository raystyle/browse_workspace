# SPA（单页应用）

点名条件：框架容器键或全局命中（react/vue/angular/svelte/qwik/ember；框架名与版本见回执 framework 字段）。

## SPA 与多页的行为分叉

- 路由切换不换文档：goto 站内链接常是 SPA 内导航，loadEvent 不会再发、readyState 一直 complete；`waitLoad()` 秒回不代表内容就绪，内容就绪用 `waitJs` 等关键节点或 `waitIdle` 等网络静默
- 元素引用表按文档代计数：SPA 路由不重换代（同文档），ref 仍有效；但组件重渲染可能换 backendNodeId，点击失败先重新 snapshot
- `setInitScript` 只对新文档生效：SPA 路由不重跑；要每路由都注入的补丁用 pageEval 在路由后补

## 常用节奏

```
return await goto("https://app.example.com/", {waitIdle: true})
await waitJs(`document.querySelector('[data-testid=feed]') !== null`, 10)
await snapshot({depth: 4})
```

## 框架特有

- react：受控 input 别 pageEval 直接改 value（React 状态不认），用 fillRef（insertText 走输入事件）或 clickRef 后键盘
- vue：`__vue_app__` 在容器上；组件状态突变走开发者面（Vue devtools 协议）不在 browse 范围
- angular：变更检测 zone 内的动作才生效，pageEval 改 DOM 后 Angular 重渲染可能覆盖你的改动
- svelte/qwik/ember：小众面，容器键命中即知，行为按通用 SPA 口径

## 陷阱

- SPA 的 404 页是 200 响应加前端空态：detect() 的 blank 判读比 HTTP 状态码可靠
- 前端路由的返回：goBack() 走浏览器历史，SPA 内部返回按钮是 JS 动作（clickRef），两者不同
- 水合未完成的页（见 hydration 配方）交互不响应：先等水合再点击
