# human-gate

人机同环对(六向增强之⑤):rn 编排跑到需要人裁的点(登录/验证码/人工
复核),经 DOM 事件 `browse-human-arm` {message} 武装——油猴世界弹
GM_notification 桌面通知并在管理页菜单注册「人工完成 → 放行」。
真人点菜单(或编排/测试 dispatch `browse-human-done` 模拟)即放行:
置 `us-human-done` 属性(DOM 跨世界)并打 see 事件进环。
mech.rn 演示零轮询等待:页内 Promise 挂事件+MutationObserver,rn 单次
await 收果(等待住在页面事件循环,宿主零 attach 自扰——①的形)。
