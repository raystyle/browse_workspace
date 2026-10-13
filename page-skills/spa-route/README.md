# spa-route

SPA 路由监听对(爬虫类)。@detect 看 prelude 的 framework 出 PLAUSIBLE;
常驻腿经 unsafeWindow 包页面主世界的 history.pushState/replaceState
(KEY 防双包),并用 defineProperty 封成 writable 与 configurable 都为 false。
页面若已封过,改登记 window.__browseRouteHooks,后来的回调仍收得到。
popstate 与 hashchange 收成 see.spa-route 摘要 {kind}。mech 等路由事件后跑调用方
快照(默认读 response-tap 缓冲)。CSP 注意:包的是页面 history 本体,
不往页面插内联脚本。素材:Qiita 四类事件法(机制可仿,X 检索轮)。
源 `build/pairs/spa-route/`,产物勿手改。
