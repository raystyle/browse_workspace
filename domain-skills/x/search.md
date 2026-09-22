# x：搜索

`x.com/search?q=<关键词>`，依赖登录态（引擎 profile 持久会话；匿名态未验证）。搜索页 HTTP 通道只回导航壳，推文客户端渲染，走浏览器通道。

## 节奏

X 长连接使 waitIdle 永不静默（常态 3 个在飞请求）：goto 不带 waitIdle，等推文用 waitJs。

```
await goto("https://x.com/search?q=<q>&f=live")
await session.waitJs("document.querySelectorAll('article[data-testid=tweet]').length > 0", 20)
```

## 推文抽取

```
return await pageEval(`(() => {
  const out = []
  for (const t of document.querySelectorAll('article[data-testid=tweet]')) {
    const text = t.querySelector('div[data-testid=tweetText]')
    const link = [...t.querySelectorAll('a[href*=status]')].find(a => a.href.includes('/status/'))
    const name = t.querySelector('div[data-testid=User-Name]')
    out.push({who: name ? name.innerText.split('\n')[0] : null, text: text ? text.innerText.trim() : null, href: link ? link.href.split('?')[0] : null})
  }
  return JSON.stringify(out)
})()`)
```

- 选择器用 data-testid（tweet / tweetText / User-Name），别信 CSS 类名（React 容器键面）
- PowerShell 直发含双引号的片段会截断字符串：属性选择器用无引号形（`[data-testid=tweet]`），含斜杠的值（`[href*="/status/"]`）改 JS 侧过滤

## tab 与翻页

- `f=live` 最新流；缺省参数即热门
- 无限滚动：window.scrollBy 循环（每轮两屏加 900ms 停顿）推文持续挂载，见 `page-skills/lazy-scroll`

## 运算符

`min_faves:<n>` 高互动过滤可用；`from:`、`since:` 等同 X 搜索语法面，未逐一实测。
