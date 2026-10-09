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
`R.see({slug,data,cta,once,throttleMs})`(观察上报,启发式 CTA 由探针按页况给)、
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
})(function (R) { R.see({ slug: 'x', data: {}, cta: 'browse rune page-skills/x/mech.rn' }); });
```

cta 是**启发式**的:探针按观察到的页况决定指什么(跑编排/读配方/导出),
不是静态表——消费面 `browse events` 直读。

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

## 首批九对（爬虫五 + 安全四）

爬虫：response-tap（钩响应采集）、scroll-until-end（滚到没有更多）、
next-page（翻页）、spa-route（SPA 路由监听）、link-table（链接清单导出）。
安全：challenge-stop（挑战页识别+条件停）、antibot-vendor（反爬产品识别）、
fingerprint-watch（指纹 API 调用观察）、policy-surface（策略与敏感面侦察）。

## 安装常驻脚本（P0，Userscript.* 域落地前）

```bash
pwsh install-userscripts.ps1 -ChromeProfile <引擎 user-data-dir> -UserJs page-skills/<slug>/probe.user.js
```

（置场 CLI 在 clean-chrome 仓 `tools/`。）装进 profile 的副本须替换
`%%BROWSE_PORT%%`（命名实例换派生端口）；改了脚本要重装，pull 不热更新。
采集对更推荐 mech.rn 注入道（`Page.addScriptToEvaluateOnNewDocument`，
跑完不留 profile）——见各对 README。
