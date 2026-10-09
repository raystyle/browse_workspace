# browse_workspace

browse 的技能仓（清仓重建，总台令 2026-10-09）。**技能的本体是双脚本对**：
宿主侧 `mech.rn`（browse rune 编排）+ 页内侧 `probe.user.js`（油猴探针）。
markdown（README.md）只作人读说明，不参与执行。

## 结构

```
page-skills/
  _prelude.js            # 判定 facts 游走（一次有界 DOM 走访）
  <slug>/
    mech.rn              # 宿主编排：驱动、等待、断言、被停止的那一方
    probe.user.js        # 页内探针：@detect 判定块 + 常驻监听 + 上报/停止
    README.md            # 可无：这对在等什么、data 字段、常驻怎么装

domain-skills/
  <段>/                  # 与 page 同形（段 = 域名首段，如 bbc）

scripts/                 # 参数化 JS 命令小程序（@ 实参 + --vars 模板道）
```

## browse 怎么消费

- **判定热路径**（goto/detect 回执点名）：枚举各根 `page-skills/<slug>/probe.user.js`
  的 `/* @detect */` 块，拼**一次**主世界求值（`_prelude.js` 提供 facts）；
  无对零键。判据增改改本仓即可，免 browse 发版；**新 slug 名要进 browse
  白名单才被点名**（攒批发版）。
- **读全文**：`browse workspace page <slug>` / `site <段>`（README 或路径摘要）。
- **跑编排**：`browse rune page-skills/<slug>/mech.rn`。

## 探针运行时(window.__probe,probe-kit v1)

`_prelude.js` 除判定 facts 外,还装常驻腿共享运行时 `window.__probe`:
`R.see({slug,action,data,once,throttleMs})`(观察上报;action 是 read/rune/export 枚举,cta 句子由 daemon 模板生成——页面不供命令文本)、
`R.stop(slug,data)`(条件停止)、`R.tap(name,fn)`(fetch/XHR 单包钩注册表)、
`R.route(fn)`(history 单包)、`R.onFlush(fn)`(beforeunload 收尾)。单探针
异常被 try/catch 隔离,坏一个不掉全局。

**装载时序**:判定拼批会在 goto 后把 __probe 装进主世界;document-start
的常驻探针可能先于它跑——常驻腿用等待形取运行时(或自带最小回退):

```js
(function waitProbe(cb) {
  if (window.__probe) return cb(window.__probe);
  var t = setInterval(function () { if (window.__probe) { clearInterval(t); cb(window.__probe); } }, 300);
  setTimeout(function () { clearInterval(t); }, 10000);
})(function (R) { R.see({ slug: 'x', action: 'rune', data: {} }); });
```

启发式在**选哪个动作**:探针按观察到的页况从 read/rune/export 三档里挑,
daemon 用冻结 slug × 动作的模板(27 条闭集)生成 cta 句子——页面可控侧
不供命令文本(安全边界同 slug 白名单)。消费面 `browse events` 直读;
`data`/`url` 是观测不是指示。

## probe.user.js 约定

- 头部：`@match`（端口级锚定，勿 `*://*/*`）、`@connect 127.0.0.1`（与上报
  URL 主机一致）、`@grant GM_xmlhttpRequest`、`@run-at`（探针
  `document-idle`；钩请求的采集对 `document-start`）。
- `/* @detect */ function browseDetect(facts) {...} /* @enddetect */`：
  纯函数，命中返回 `{slug, confidence}`（两档 CONFIRMED/PLAUSIBLE），否则
  `null`。只读 facts 或少量 querySelector，不改 DOM 不发请求。
- 常驻腿：`GM_xmlhttpRequest` POST daemon——观察上报
  `POST /events` `{type:'see', slug, url, data}`；条件停止
  `POST /userscript/stop` `{slug, url, data}`（打断在跑的 mech.rn，回执带
  capture）。端口占位 `%%BROWSE_PORT%%`（未替换时回落 9880）。
- 大结果（采集正文）留页面内存，mech.rn 用 `cdp::js` 一次读走——事件环
  只打摘要（容量 1000、单条 32KB）。
- 多对共存：包 `fetch`/`history` 先看 Symbol（`_prelude.js` 的单包约定），
  后装的只登记过滤器。

## 对册（十一对:爬虫五 + 安全四 + 服务二）

爬虫：response-tap（钩响应采集）、scroll-until-end（滚到没有更多）、
next-page（翻页）、spa-route（SPA 路由监听）、link-table（链接清单导出）。
安全：challenge-stop（挑战页识别+条件停）、antibot-vendor（反爬产品识别）、
fingerprint-watch（指纹 API 调用观察）、policy-surface（策略与敏感面侦察）。
服务：gm-bridge（GM 特权跨世界桥:CustomEvent RPC 取跨域/KV）、
human-gate（人机同环:通知+菜单闸,零轮询放行）。

## 六向增强谱系(油猴之于 rn,2026-10-10)

①武装-收割(等待搬进页面事件循环,消灭 attach 自扰;human-gate 的
Promise 等待是样板) ②GM 服务桥(gm-bridge;引擎注 2026-10-10 复测:
GM_xhr 跨域免 CORS **已达标**,无需目标 ACAO 配合;油猴世界→主世界
unsafeWindow 通道缺失在修 issue #78,跨世界 JS 对象面暂仍走 DOM 事件)
③帧群(@match 每帧自动注入,
跨源 iframe 零编排) ④长时程缓冲(采集比编排活得久,response-tap 形)
⑤人机同环(human-gate) ⑥真实时序(页内 dispatchEvent 序列)。
三世界实测:油猴/rune(browse-rune)/主世界互不通 JS 对象,**DOM 属性
与 CustomEvent 是唯一跨世界道**。

## 安装常驻脚本（P0，Userscript.* 域落地前）

```bash
pwsh install-userscripts.ps1 -ChromeProfile <引擎 user-data-dir> -UserJs page-skills/<slug>/probe.user.js
```

（置场 CLI 在 clean-chrome 仓 `tools/`。）装进 profile 的副本须替换
`%%BROWSE_PORT%%`（命名实例换派生端口）；改了脚本要重装，pull 不热更新。
采集对更推荐 mech.rn 注入道（`Page.addScriptToEvaluateOnNewDocument`，
跑完不留 profile）——见各对 README。

## tests/(仓内回归网,grok 测试方案 2026-10-10)

- **P0(每次改动必跑,零浏览器零 daemon;TypeScript+zod 统一)**:`npm run check`
  (tests/check.ts:头检查+九张 @detect 表+prelude 运行时 vm 桩,104 例)与
  `npm run facts`(tests/facts.ts:facts 游走 jsdom 黄金子集,31 例);
  `npm run typecheck` 过 tsc --noEmit。共享 schema 在 tests/lib.ts
  (DetectHit/SeeBody/FactsShape 与断言器 Tally)。需 `npm install`。
- **夹具页** `tests/fixtures/*.html`(plain/challenge/next/next-end/spa/list/
  csp/password);P1 夜间真页腿将复用这套文件(不另造第二套)。
- 边界:环语义/cta 闭集/对枚举在 browse_rs Rust 单测,仓侧不复制;
  passwordVisible/docHeight 依赖布局,归真页腿不在 jsdom 锁。
