# 连接与附着

场景：接用户正开着的浏览器、显式指定目标、测试隔离。

- 引擎策略附着优先：片段缺省形态与 up 都先探测已开调试浏览器（附着态），缺则 spawn clean-chrome 隔离实例；`BROWSE_NO_ATTACH=1` 跳过探测强制 spawn（本机 9222 开着用户浏览器时测试要自起隔离实例）
- 探测与解析：`detectBrowsers()`（profile/端口/wsUrl 线索）、`resolveWsUrl(opts)`（把线索解析成 WS URL，不连接）
- 连接：`session.connect({wsUrl, port, profileDir, timeoutMs})`（要等 Chrome 远程调试弹窗人工 Allow 就给 30000）；路由到 tab：`session.use(targetId)`；CLI 面 `browse --connect <ws|端口> '<片段>'` 与 up 的 --ws/--port
- 守卫在 cdp `Session::call` 层：关用户浏览器绕不过是特性不是 bug；closeTab 只放行自建 tab（见 tabs.md）
- 人机共存：switchTab 不改 Chrome 可见前景；要画面带到前面用 Target.activateTarget
- 陷阱：附着态下 env 只影响新拉起进程，改配置重启 daemon（BROWSE_SECRETS 同语义在册）；命名实例 BROWSE_NAME 各自状态目录与派生端口，互不抢 chrome 单实例锁
