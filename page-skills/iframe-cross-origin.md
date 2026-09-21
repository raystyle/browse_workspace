# 跨源 iframe（OOPIF）

点名条件：iframe src 域名与当前页 hostname 不同（支付台、第三方登录、嵌入式地图/播放器常见）。跨源 iframe 是独立渲染进程（OOPIF），与同源 iframe 的穿透路径完全不同。

## browse 首选：pierce 合并子 session 树

`snapshot({pierce: true})` 对 OOPIF 走子 session AX 树合并：节点带 oopif 标、frame targetId 与 ownerSession，进同一 ref 表，全动词可用：

- clickRef/hoverRef/dblclickRef/dragRef：子 session 量中心后用父页 iframe 元素 rect 提升到顶层视口系（遮挡检查在父页对 iframe 做一次）
- fillRef/typeRef/selectOption/checkRef：焦点与键盘走子 session
- screenshot({ref})：裁剪同样提升

```
await snapshot({pierce: true})   // OOPIF 内节点带 oopif 标
await clickRef("e23")
```

## 子 session 机制（排查穿透失效时看）

子 session 靠「发现 + 显式 attach」：browse 扫 Target.getTargets 逐个 attachToTarget(flatten)，OOPIF 销毁按 Target.detachedFromTarget 摘账。本机 Chrome 152 实测 Target.setAutoAttach 无论挂浏览器级还是页面级、带不带 filter:[{type:"iframe"}]，都不产生 iframe 型 attachedToTarget，所以 OOPIF 不能靠 auto-attach，必须显式 attach（browse 已内置，这条是排查背景知识）。

## 陷阱

- **嵌套 OOPIF（OOPIF 里再套 OOPIF）只提升一层**：深层节点的坐标可能错位，属已知边界；点不到就进父 OOPIF 手动 scrollIntoView 后重新 snapshot
- OOPIF 加载有竞速：iframe 面出现不等于子 session 就绪，紧接导航后先 waitLoad() 再 pierce；首次 pierce 拿不到就再 snapshot 一次
- 跨源 iframe 内的页面有自己的 goto/历史：对 iframe 内容做导航要 session.use 切到子 target，别在父页 goto
- 支付台/登录挂件常带 X-Frame-Options 与 CSP frame-ancestors：那是别人站不让嵌，与你的穿透无关
- 跨源 iframe 的 cookie 隔离：cookieGet 只看当前页域，OOPIF 域的 cookie 要切到该域页面再查
