# 登录墙

点名条件：可见 password 框或登录骨架（PLAUSIBLE：很多站登录框常驻页头，不等于内容被锁，agent 权衡）。

## 先判内容到底锁没锁

登录框常驻导航栏的站会误点名。判读链：

1. `detect()`：verdict=login-wall（complete 且有密码框）只是保守信号
2. 直接试着抓目标内容：`pageEval` 取正文，空/截断/只有营销文案才是真墙
3. 真墙的站常有 URL 规律（/login、/signin、?redirect=）：goto 后 URL 跳到登录页即实锤

## 带登录态的三条正道

- 热迁（推荐）：附着用户浏览器时 `cloneCookies(["site.example"])` 把该域登录态只读迁入引擎，源零写回
- 整包往返：用户在别处导出 `exportStorageState()`，你 `importStorageState(state 或 path)` 灌入
- 手工登录一次：有头引擎（spawn 缺省非 headless）让用户/自己在页面登录，引擎 profile 持久保存站点会话（down 不删，复用登录态）

```
await cloneCookies(["site.example"])
return await goto("https://site.example/dashboard", {waitIdle: true})
```

## 登录表单自动化（有凭据时）

```
await fillRef("e3", "user@example.com")   // 先 snapshot 拿 ref
await fillRef("e5", "pass", true)          // submit: true 顺带 Enter
```

密码框 fillRef 走 insertText 输入事件，主流站兼容；带 reCAPTCHA 的登录走 captcha 配方先。

## 陷阱

- 登录态 cookie 常带 HttpOnly：pageEval 的 document.cookie 读不到不代表没登录，用 `cookies("site.example")`（CDP 面）查
- SSO 跳转链（Google/Microsoft 登录）跨多域：goto 目标会连环跳，waitIdle 一步等全链静默
- 两步验证（2FA）：自动化到这一步停下交人工，别试遍历码
- 会话过期的表现常是 302 到登录页：goto 回执 url 变了就是信号
