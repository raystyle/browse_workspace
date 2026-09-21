# service worker

点名条件：`navigator.serviceWorker.controller` 非空（PWA、离线壳、前端代理型站）。

## service worker 改变了什么

- 请求面被 worker 接管：requests() 看到的仍是 Network 域事件（worker 的 fetch 也在），但响应可能来自 worker 缓存（status 200 却无网络往返，responseBody 取到的是缓存体）
- 离线壳：断网/路由不存在都可能渲染「正常」页面（app shell 兜底），URL 命中不代表内容存在，判内容用正文签名别用状态码
- 更新滞后：worker 缓存的旧版 HTML 可能先渲染再后台更新，同 URL 两次 goto 内容可能不同

## 常用手法

确认谁在控制页面：

```
return await pageEval(`(() => {
  const c = navigator.serviceWorker && navigator.serviceWorker.controller
  return JSON.stringify({controlled: !!c, scope: c && c.scriptURL})
})()`)
```

绕开 worker 缓存拿新鲜数据：直接打数据 API（worker 之外的端点）或带 cache-busting 参数；硬刷新用 `reload({ignoreCache: true})`。

等 worker 就绪（PWA 安装页常见竞速）：

```
await waitJs(`navigator.serviceWorker.controller !== null`, 10)
```

## 陷阱

- worker 的 install/update 事件里的请求：Network 域只记页面 session 的，worker 自身请求在 worker target，requests() 可能看不到预缓存清单
- 注销 worker 影响站点行为（下次访问重装）：`pageEval` 调 `navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))` 只在排查缓存问题时用，别当常规操作
- push 通知弹窗：grantPermissions 别顺手给 notifications，PWA 会弹系统通知
- 离线壳站点的 detect() 判读：blank 档误报率升高（壳渲染了但数据空），配合 jsErrors() 与 requests() 计数交叉判
