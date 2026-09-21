# 懒加载滚动（长页与虚拟列表）

点名条件：页高 >= 8 倍视口且有滚动容器窗口特征（PLAUSIBLE 档：覆盖 virtual-list 与 infinite-scroll 两类，agent 权衡）。

## 滚轮走手势合成

`mouseWheel(dx, dy)` 走 synthesizeScrollGesture 手势合成，触发监听 wheel 事件的懒加载（SPA 常见）：

```
await mouseWheel(0, 800)      // 向下 800px
await waitIdle(2)             // 等懒加载内容进来了
await snapshot({depth: 3})    // 再扫新内容
```

注意导航后首个 wheel 事件可能被渲染器吞（监听注册握手）：mouseWheel 已绕开此坑；要精确单事件裸调 Input.dispatchMouseEvent 时记得自发两次。

## 无限滚动（infinite scroll）的停判

滚一步等一步，正文高度不再涨即到底：

```
return await pageEval(`(() => {
  const h = () => document.documentElement.scrollHeight
  let last = 0, cur = h(), n = 0
  return (async () => {
    while (cur !== last && n < 30) {   // 封顶 30 轮防死滚
      last = cur
      window.scrollBy(0, window.innerHeight * 2)
      await new Promise(r => setTimeout(r, 800))
      cur = h(); n++
    }
    return JSON.stringify({rounds: n, height: cur})
  })()
})()`)
```

或用 browse 原语循环：mouseWheel 后 waitIdle，`pageEval` 读 scrollHeight 对比。

## 虚拟列表（virtual list）

虚拟列表只渲染视口内节点：snapshot 拿不到全部条目，滚动中分段扫，按稳定键（id/href）去重拼接。不要试图一次 snapshot 拿全量。

## 滚动容器不在 window

有的页滚动发生在内层容器（overflow:auto 的 div）：mouseWheel 落点用最近 mouseMove 位置（缺省中上），先 hoverAt 到容器内再滚；或 pageEval 直接容器 scrollBy。

## 陷阱

- 滚轮 dy 正方向是向下，别记反
- 惯性滚动（momentum）下手势会连滚：要精确落点分小步滚
- 懒加载图片有 loading 占位：等真实加载用 waitForResponse 配合图片 URL pattern，别只看节点出现
- scroll 事件节流的站 800ms 可能不够：看 requests() 是否还在进，waitIdle 判静默更稳
