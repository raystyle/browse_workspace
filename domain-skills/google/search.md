# google：搜索面

google.com 裸域网页搜索（www.google.com/search）；子域各自成段（news.google.com 是 news 段、mail.google.com 是 mail 段，不在本文件）。2026-09-21 建基线，2026-09-22 复测修订：零浏览器腿翻车，浏览器腿升主通道。

## 零浏览器腿（2026-09-22 复测翻车，降级为便宜先试）

```bash
browse fetch 'https://www.google.com/search?q=rust+cdp'
```

- 2026-09-21 实测 200 直出结果；2026-09-22 同网络复测拿到 JS 跳转中转页（正文只剩 "Please click here if you are not redirected..."）
- 结论：此腿随 Google 出口 IP 与风控动态切换，不可靠；保留价值是成本极低：先试一次，翻车立刻转浏览器腿，不要原地重试
- 参数仍然有效：`&hl=en&gl=us` 钉英文美区；`&num=50` 拉条数；`site:` 与 `-` 等运算符照常

## 浏览器腿（2026-09-22 实测通过，主通道）

```
await goto("https://www.google.com/search?q=<q>&hl=en&gl=us", {waitIdle: true})
```

- 自然结果抽取（实测 8 条干净 title 加 href）：

```
return await pageEval(`(() => {
  const out = []
  for (const h3 of document.querySelectorAll('a[href] h3')) {
    const a = h3.closest('a')
    if (a && a.href.startsWith('http') && !a.href.includes('google.')) out.push({title: h3.textContent.trim(), href: a.href})
  }
  return JSON.stringify(out)
})()`)
```

- 翻页免点击（实测 `&start=20` 第二页 10 条与首页不重叠）：URL 直接加/改 `&start=10`、`&start=20`
- `site:` 运算符实测通过：`site:github.com chromiumoxide` 结果全落 github 域
- 要可点元素引用时改走 `snapshot` 后按结果标题 `findRefs`

## 搜索进页抓正文管线（2026-09-22 实测）

搜索与逐页抓取的循环放 shell 层（daemon 会话跨命令存活，每页一条片段）；方言管单页编排，页面内循环写在 pageEval 的页内代码里：

1. 搜索片段回 JSON 串，shell 侧两层 ConvertFrom-Json 解开
2. 逐页：`await goto(url, {waitIdle: true})` 加 `pageEval` 抽 `{title, url, text}`（article 优先 body 兜底，即 snippets/read-page.js 配方）
3. SPA 结果页（crates.io 实测）waitIdle 后正文仍空：goto 后补 `await session.waitJs('document.body && document.body.innerText.trim().length > 50', 10)` 再抽（对策同 page-skills/hydration）

## 边界与坑

- 出口 IP 落 EU 类地区时可能先弹 consent.google 同意墙：零浏览器面拿不到结果；浏览器腿 goto 后让用户点一次（或对已知域 setInitScript 预选）再继续
- 高频自动化搜索会触 429 或验证码（对策见 page-skills/captcha）：批量检索降频或换官方 API，别硬闯
- AI 模式与个性化结果随登录态变：对照结论注明是否登录态
- 搜索结果页是 React 面：优先 AX 树与 href 属性，别依赖 CSS 类名
