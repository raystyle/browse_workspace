# google：搜索面

`www.google.com/search` 网页搜索。子域各自成段：news / mail 不在本文件。

## HTTP 通道（不稳定，先试）

```bash
browse fetch 'https://www.google.com/search?q=rust+cdp'
```

- Google 按出口 IP 与风控动态切换服务端渲染与 JS 跳转：成功直出结果文本，失败只剩一句 "Please click here if you are not redirected..."
- 成本极低，可先试一次；失败即转浏览器通道，不要原地重试
- 回执是标题与摘要混排的正文；要逐条 URL 清单必须走浏览器通道
- 参数：`&hl=en&gl=us` 钉英文美区；`&num=50` 拉条数；`site:` 与 `-` 等运算符照常

## 浏览器通道（主路径）

```
await goto("https://www.google.com/search?q=<q>&hl=en&gl=us", {waitIdle: true})
```

自然结果抽取：

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

- 翻页免点击：URL 直接加/改 `&start=10`、`&start=20`
- 要可点元素引用：`snapshot` 后按结果标题 `findRefs`

## 搜索进页抓正文

循环放 shell 层，daemon 会话跨命令存活，每页一条片段；方言管单页编排，页面内循环写在 pageEval 页内代码里。

1. 搜索片段回 JSON 字符串，CLI 输出再包一层，shell 侧两层解析
2. 逐页 `goto(url, {waitIdle: true})` 加 `pageEval` 抽 `{title, url, text}`：article 优先 body 兜底，即 `snippets/read-page.js` 配方
3. SPA 结果页 waitIdle 后正文仍空：goto 后补 `await session.waitJs('document.body && document.body.innerText.trim().length > 50', 10)` 再抽，同 `page-skills/hydration`

## 边界与坑

- 出口 IP 落 EU 类地区可能先弹 consent.google 同意墙：HTTP 通道拿不到结果；浏览器通道 goto 后让用户点一次，或对已知域 setInitScript 预选再继续
- 高频自动化搜索会触 429 或验证码，对策见 `page-skills/captcha`：批量检索降频或换官方 API，别硬闯
- AI 模式与个性化结果随登录态变：对照结论注明是否登录态
- 搜索结果页是 React 面：优先 AX 树与 href 属性，别依赖 CSS 类名
