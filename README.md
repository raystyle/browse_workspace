# browse_workspace

browse 技能仓。每对技能是宿主 `mech.rn` + 页内 `probe.user.js`。README 只给人读。

## 结构

```
page-skills/
  _prelude.js            # 判定 facts + window.__probe
  <slug>/mech.rn         # rune 编排
  <slug>/probe.user.js   # 油猴探针(@detect + 常驻)
build/                   # 生成器与 TS 源
  pairs/<slug>/          # 单件对源: probe.head.txt + probe.body.ts + mech.rn
scripts/vendor/          # mdream 钉版
domain-skills/<段>/      # 域名技能,段 = 域名首段
scripts/                 # JS 小程序(@实参 + --vars)
```

google-search 是两段式:`probe.skeleton.user.js`(document-start) + `probe.heavy.user.js`(document-idle,内嵌 mdream)。其余单件对源在 `build/pairs/<slug>/`,`pnpm build` 写出 `page-skills/`。antibot-vendor 与 gm-bridge 手写,不经生成器。

## browse 怎么用

- 判定:goto/detect 拼各对 `@detect` 与 `_prelude.js` 一次主世界求值。新 slug 要进 browse 白名单才点名。两段式的 detect 在 skeleton。
- 读说明:`browse workspace page <slug>` / `site <段>`
- 跑编排:`browse rune page-skills/<slug>/mech.rn`
- 装探针:`browse userscript install <file...> --restart`

## window.__probe

`_prelude.js` 提供 facts 游走,并装 `R.see` / `R.stop` / `R.tap` / `R.route` / `R.onFlush`。`see` 的 action 只许 `read|rune|export`。判定拼批在 goto 后把 `__probe` 放进主世界;document-start 探针可能更早,可等 `__probe` 再登记。

## probe 约定

- 头:`@match`、`@connect 127.0.0.1`、`@grant GM_xmlhttpRequest`、`@run-at`
- `@detect` 返回 `{slug, confidence}` 或 `null`;不改 DOM、不发请求
- 观察:`POST /events`;停止:`POST /userscript/stop`;端口 `%%BROWSE_PORT%%`,未替换则 9880
- 大结果留页面内存,mech 用 `cdp::js` 读走

## 技能

| 名称 | 说明 |
| --- | --- |
| antibot-vendor | 识别反爬产品 |
| challenge-stop | 挑战页出现时停止编排 |
| fingerprint-watch | 观察 canvas、audio、字体、webdriver 调用 |
| gm-bridge | 经 DOM 事件向其他世界提供 `GM_xmlhttpRequest` |
| google-search | Google SERP 判读与结果页采集 |
| human-gate | 等待人工确认后继续编排 |
| link-table | 导出页面链接及 css、xpath |
| next-page | 翻页采集 |
| policy-surface | 报告 CSP、密码框与存储键名 |
| response-tap | 旁路 fetch、XHR、open、WebSocket、EventSource |
| scroll-until-end | 滚动至无新增内容 |
| spa-route | 监听 `pushState`、`replaceState`、`popstate`、`hashchange` |
| x-search | x.com 实时搜索 |

## 测试

`pnpm check`、`pnpm facts`、`pnpm typecheck`。夹具在 `tests/fixtures/`。
