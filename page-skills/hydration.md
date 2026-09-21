# 水合（hydration / 水合窗口期）

点名条件：`__next_f` / `__NUXT_DATA__` / astro-island / `[q:container]` 特征命中（next/nuxt/qwik/astro 系）。

## 为什么水合是独立特征

服务端渲染（SSR）的 HTML 先到、JS 水合后交互才活：水合窗口期内 DOM 完整可读但点击无响应。这是「内容抓取能过、交互全失败」的头号原因，故从 spa 独立点名。

## 判水合完成

```
return await pageEval(`(() => {
  const marks = [
    () => window.__next_f && window.__next_f.length > 1,   // App Router 流数据
    () => !!window.__NUXT_DATA__,                            // nuxt
    () => document.querySelector('astro-island') &&         // astro 岛已水合
      [...document.querySelectorAll('astro-island')].every(i => i.hasAttribute('ssr')),
    () => !!document.querySelector('[q\\\\:container][q\\\\:container-rendered]'),
  ]
  return JSON.stringify(marks.map(f => { try { return f() } catch (e) { return null } }))
})()`)
```

实战更稳的判官是行为面：等交互目标真的响应。`waitJs` 等水合敏感标记（如 next 的 hydration 完成常伴随应用容器 class 变化），或直接 clickRef 后用 waitForResponse 确认应用层请求发出。

## 抓内容与做交互的分野

- **只抓内容**：SSR HTML 即终稿，goto 后直接 pageEval/snapshot，不用等水合（省时间的主通道）
- **要做交互**（点击/填表/翻页）：必须等水合；水合窗口内 clickRef 静默无效（trusted 事件派发了但监听没挂上）

## 陷阱

- 水合失败（JS 报错）的页：DOM 永远不活，jsErrors() 看异常，别死等
- next App Router 与 Pages Router 标记不同（`__next_f` vs `#__NEXT_DATA__`）：探测只认 App Router 形，Pages Router 页可能不点名，交互失灵时自己查 `#__NEXT_DATA__`
- astro 多岛渐进水合：视口外的岛未水合是常态，滚到可见再等
- qwik 的懒执行：交互时才下载处理器，首次点击比常站慢，waitForResponse 里能看到处理器请求
