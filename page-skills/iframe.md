# iframe（同源穿透）

点名条件：页面 iframe 清单非空（登录挂件、嵌入式播放器、富文本编辑器常见）。

## browse 首选：pierce 快照

同源 iframe 内容走 `snapshot({pierce: true})`：contentDocument 穿透，iframe 内节点带 ref 直接进同一 ref 表，`clickRef`/`fillRef`/`selectOption` 全动词可用。

跨 frame 坐标已自动提升：clickRef 在节点自身 frame 量中心后沿 frameElement 链累加偏移到顶层视口系（Input 派发系），不需要手工算。

```
await snapshot({pierce: true})
await fillRef("e7", "user@example.com")
```

注意顶层 AX 树（默认 snapshot）只见 Iframe 角色节点，不含 iframe 内内容；findRefs 同样只搜顶层，要穿透先 pierce。

## 判定 iframe 是否同源

探测回执只报 iframe 与 iframe-cross-origin 两档；同源判定看 iframe src 与当前页 hostname（显式端口不影响同源判定）。页内自查：

```
return await pageEval(`(() => {
  return JSON.stringify([...document.querySelectorAll('iframe')].map(f => {
    let same = null
    try { same = !!f.contentDocument } catch (e) { same = false }
    return {src: f.src || '(no src)', sameOrigin: same}
  }))
})()`)
```

`contentDocument` 抛异常或为 null 即跨源（走 iframe-cross-origin 配方）。

## 无 src iframe

`about:blank` 或 JS 动态建的 iframe 没有 src：仍可能同源（继承父源），pierce 能进；src 为空的挂件常在 load 后才填内容，紧接导航后先 `waitLoad()` 再 snapshot。

## 陷阱

- pierce 清单与 AX 投影有结构节点重复（html/body 双份，ref 各自唯一同 backendNodeId）
- 被缩放的 iframe（CSS transform scale）坐标提升会错位：browse 检测到即报错不猜，去掉 scale 或改坐标点击
- iframe 内的懒加载内容：先 mouseWheel 触发父页滚动再 pierce（见 lazy-scroll 配方）
