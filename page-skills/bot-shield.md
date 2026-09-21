# bot 盾（Cloudflare 类挑战）

点名条件：cf-chl 类挑战 DOM（CONFIRMED）或 CF cookie（cf_clearance / __cf_bm，PLAUSIBLE）。PLAUSIBLE 档只是 cookie 在场：正常访客也有 __cf_bm，不等于正被挑战，配合 detect() 判读。

## 先判是不是真被挡

```
return await detect()    // challenged 判读优先于一切（挑战关键词加 403/503 或短正文）
```

detect() verdict=challenged 时才按本配方走；verdict=ok 的 PLAUSIBLE 点名可忽略。

## 挑战页的标准节奏

1. goto 后别立刻交互：挑战页通常 5 秒内自动跳转（JS 挑战），等它自己过：

```
return await goto("https://site.example/", {waitIdle: true})
await waitJs(`!document.querySelector('cf-chl-running, #challenge-running')`, 15)
```

2. 等到挑战标记消失后，确认落点是正文不是循环挑战：再 detect() 或看 title
3. 仍被挡：真人验证（Turnstile 复选框）等人工介入，见 captcha 配方

## cookie 面

- cf_clearance 是过挑战的通行证（有 TTL）：同站后续 goto 带着它走
- 从用户浏览器热迁登录态/通关态：`cloneCookies(["site.example"])`（源零写回；无附着源报错指 storageState 整包往返）
- 引擎 profile 持久保存站点会话：过一次挑战后 down 不丢，下次 spawn 复用

## 陷阱

- 挑战页 HTTP 状态常是 403/503：不是站点挂了，别误判
- 反复循环挑战（过了又来）：UA/头面被画像了，emulate({userAgent}) 换 UA 或走 API 等正道，别硬刷
- 别用 routeMock/routeBlock 拦挑战域的资源：挑战 JS 加载不全只会更出不来
- 尊重边界：过盾是让正常访问恢复，绕付费墙/反爬条款不在 browse 职责面
