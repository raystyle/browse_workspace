# 视口与仿真

场景：坐标点击的稳定性、响应式断点测试、移动端模拟。

- 设定：`emulate({viewport, mobile, userAgent})`（三参全可省；mobile 档同站更省 token；userAgent 连带 UA-CH 高熵字段原生覆写，非 JS 注入）
- 媒质仿真：`emulateMedia(opts)`（五特征任给其一以上）与还原 `emulateMediaClear()`；与 emulate 并列成族
- 仿真挂在 target 上跨导航保留：goto 后要回默认视图记得清；viewport 覆写的清除走 `session.call("Emulation.clearDeviceMetricsOverride")`
- 坐标空间：emulate 之后所有坐标点击都在新视口的 CSS 像素空间；视口一变旧坐标即失准，重新 snapshot 再动作（不只滚动后要重读矩形）
- 陷阱：截图是设备像素，devicePixelRatio=2 时图上目测 (400,300) 对应 CSS (200,150)；用 matchMedia 的响应式站点要把 override 应用在 navigate 之前；resize 防风暴（debounce）的站点等约 300ms 再读矩形或点击；innerWidth=0 说明 attach 到非窗口表面（omnibox 弹窗类），见 tabs.md 重选 target
