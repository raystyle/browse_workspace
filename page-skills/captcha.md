# 验证码（reCAPTCHA / hCaptcha / Turnstile）

点名条件：recaptcha/hcaptcha/turnstile 特征（`.g-recaptcha`/`.h-captcha`/`.cf-turnstile`/`[data-sitekey]` 或对应 script src）。

## 边界先说清

browse 不做验证码自动求解：点是「让正常访问恢复」的交互面，自动绕过（打码平台、token 伪造）不在职责面。本配方管三件事：识别类型、给人工留位、换正道。

## 识别类型

```
return await pageEval(`(() => {
  const s = document.querySelector('script[src*="recaptcha"], script[src*="hcaptcha"], script[src*="challenges.cloudflare.com"]')
  const el = document.querySelector('.g-recaptcha, .h-captcha, .cf-turnstile, [data-sitekey]')
  return JSON.stringify({script: s && s.src, sitekey: el && el.getAttribute('data-sitekey'),
    invisible: !!document.querySelector('.g-recaptcha[data-size=invisible], [data-size=invisible]')})
})()`)
```

## 类型对策

- Turnstile（Cloudflare）：多为无感或_managed，挑战出现时通常自动过；停在「验证您是否是真人」时等 10 秒，个别形态要点一下复选框（clickRef 到 widget 容器），仍不过走 bot-shield 配方
- reCAPTCHA v2 复选框：点击后有图题即交人工；invisible 版会在提交时弹出，提交后 waitForResponse 看 verify 响应
- hCaptcha：同 v2；无障碍口（accessibility cookie）是官方正道，属账号侧配置不属于自动化

## 人工协作位

有头引擎 + highlight：把 widget 画框编号，人在屏幕上完成，agent 继续后链路：

```
await snapshot({pierce: true})     // widget 常嵌 iframe（OOPIF），pierce 拿 ref
await annotate(["e31"])
```

## 换正道

多数带验证码的站点有 API 或 RSS/feed 旁路；登录态 cookie 迁入后验证码面常消失（信任已建立）。要频繁访问的站，优先申请 API key。

## 陷阱

- 验证码 iframe 是跨源的：snapshot 默认只见 Iframe 节点，要 pierce
- token 有效期短：过了验证码立刻做后续动作，别隔夜
- routeBlock 别拦 google.com/hcaptcha.com/cf 域：拦了 widget 永远加载不出
