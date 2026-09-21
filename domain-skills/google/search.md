# google：搜索面

google.com 裸域网页搜索（www.google.com/search）优先零浏览器通道；子域各自成段（news.google.com 是 news 段、mail.google.com 是 mail 段，不在本文件）。2026-09-21 实测基线。

## 先零浏览器（2026-09-21 本网络实测可用）

```bash
browse fetch 'https://www.google.com/search?q=rust+cdp'
```

- 实测 200：服务端渲染结果直接可用，无需 JS、无 consent 墙（界面语言随出口 IP 地区，本网络出繁中）
- 参数：`&hl=en&gl=us` 钉英文美区；`&num=50` 拉条数；`site:` 与 `-` 等运算符照常
- 回执是抽取的正文文本（标题与摘要混排）：要逐条的 URL 清单走浏览器腿

## 浏览器腿

```
goto("https://www.google.com/search?q=<q>", {waitIdle: true})
```

- 结果锚点：pageEval 清点自然结果的 `a[href]`（`h3` 的父链），或 `snapshot` 后按结果标题 `findRefs`
- 翻页免点击：URL 直接加/改 `&start=10`、`&start=20`
- 语言/地区参数同 fetch 面

## 边界与坑

- 出口 IP 落 EU 类地区时可能先弹 consent.google 同意墙：零浏览器面拿不到结果；浏览器腿 goto 后让用户点一次（或对已知域 setInitScript 预选）再继续
- 高频自动化搜索会触 429 或验证码（对策见 page-skills/captcha）：批量检索降频或换官方 API，别硬闯
- AI 模式与个性化结果随登录态变：对照结论注明是否登录态
- 搜索结果页是 React 面：优先 AX 树与 href 属性，别依赖 CSS 类名
