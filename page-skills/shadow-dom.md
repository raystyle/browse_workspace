# shadow DOM

点名条件：页面前 800 节点内命中 shadowRoot（web component 站、Lit/Stencil 组件库常见）。

## browse 首选：pierce 快照

`snapshot({pierce: true})` 走 DOM.getDocument pierce 穿透同源 shadow 边界，shadow 内节点直接进同一 ref 表，`clickRef`/`fillRef` 全动词可用，不需要自己遍历：

```
await snapshot({pierce: true})
await clickRef("e12")
```

注意 findRefs 只搜顶层 AX 树：shadow 内节点搜不到，先 pierce 再按 role/name 挑 ref。

## 坐标点击兜底

合成器级点击不关心 shadow 边界：截图里看得见就点得着（`clickAt(x, y)`）。closed shadow root（JS 遍历不了，密码管理器与部分 Google 组件用）与遮挡 tricky 的场景走这条路。

## 页内遍历（拿精确坐标/值时）

```
return await pageEval(`(() => {
  function* walk(root) {
    const stack = [root]
    while (stack.length) {
      const n = stack.pop(); if (!n) continue
      yield n
      if (n.shadowRoot) stack.push(...n.shadowRoot.children)
      stack.push(...(n.children || []))
    }
  }
  for (const el of walk(document.body)) {
    if (el.matches && el.matches('.target')) {
      const r = el.getBoundingClientRect()
      return JSON.stringify({x: r.x + r.width/2, y: r.y + r.height/2})
    }
  }
  return null
})()`)
```

## shadow 内 input 设值

找到 input 后与普通 input 无异，事件加 `composed: true` 才能跨 shadow 边界冒泡（很多组件监听宿主元素）：

```
await pageEval(`(() => {
  const host = document.querySelector('my-form')
  const input = host.shadowRoot.querySelector('input[name=email]')
  input.focus(); input.value = 'hi@example.com'
  input.dispatchEvent(new Event('input', {bubbles: true, composed: true}))
})()`)
```

## 陷阱

- closed shadow root（`{mode: 'closed'}`）JS 遍历不了：改坐标点击 + fillRef 之外的 Input.insertText 路径；很少见
- slot 内容在 light DOM 不在 shadow root：找 `<slot>` 的子元素用 `host.children` 而非 `host.shadowRoot.children`
- `::part()`/`::slotted()` 只管样式，DOM 查询没有等价物，仍要遍历 shadowRoot
- backendNodeId 是全局的：跨 shadow 的 ref 表天然生效
- pierce 清单与 AX 投影有结构节点重复（同 backendNodeId 双 ref，name 取 aria-label 或 id 非可见文本）
