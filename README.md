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

- 判定：`goto` / `detect` 拼各对 `@detect` 与 `_prelude.js`，一次主世界求值。两段式的 detect 在 skeleton。
- 读说明：`browse workspace page <slug>` / `site <段>`
- 跑编排：`browse rune page-skills/<slug>/mech.rn`
- 装探针：`browse userscript install <file...> --restart`
- 读事件：`browse events`

## 事件与 cta

探针经 `GM_xmlhttpRequest` 上报 daemon。页面 `fetch` 会被 CORS 拦住。端口为安装时替换的 `%%BROWSE_PORT%%`，未替换则 `9880`。

### 上报

| 端点 | 作用 | 请求体 |
| --- | --- | --- |
| `POST /events` | 观察（`type: see`） | `{type, slug, url, data, action}` |
| `POST /userscript/stop` | 打断正在执行的 `mech.rn` | `{slug, url, data}` |

`action` 只允许 `read`、`rune`、`export`。探针不得自带命令文本。`stop` 不关浏览器、不关 daemon、不清事件环；无在跑的 rune 时入环并返回 `stopped: false`。

`window.__probe`（`_prelude.js`）提供同一套接口：

| 方法 | 作用 |
| --- | --- |
| `R.see({slug, action, data, once, throttleMs})` | `POST /events` |
| `R.stop(slug, data)` | `POST /userscript/stop` |
| `R.tap(name, fn)` | 页内拦截 `fetch` / `XHR`，回调 `{url, body, status, kind}`，不上报 daemon |
| `R.route(fn)` | 页内监听 `pushState` / `replaceState` / `popstate` / `hashchange`，回调 `{kind}`，并清空 see 去重表 |
| `R.rearm()` | 清空 see 去重表 |

判定拼批在 `goto` 之后把 `__probe` 放进主世界。`document-start` 探针若更早执行，可等到 `__probe` 再登记。部分探针直接 `GM_xmlhttpRequest`，不经过 `R.see`。

### cta 何时出现

daemon 按 `slug` + `action` 生成 `cta`：

| action | cta |
| --- | --- |
| `read` | `browse workspace page <slug>` |
| `rune` | `browse rune page-skills/<slug>/mech.rn` |
| `export` | `browse rune page-skills/<slug>/mech.rn` |

仅下列 slug 会生成 cta。其余事件仍入环，不含 `cta` 字段：

`response-tap`、`scroll-until-end`、`next-page`、`spa-route`、`link-table`、`challenge-stop`、`antibot-vendor`、`fingerprint-watch`、`policy-surface`

缺 `action`、非法 `action`、名单外 slug：事件保留，无 cta。`google-search`、`x-search`、`gm-bridge`、`human-gate` 不在名单内。

同一 `(slug, action)` 在 2 秒内重复的 see 不入环，回 `{ok: true, throttled: true}`。`R.see` 默认再按 `slug|action|pathname` 去重；`R.route` 换路径后可再报。

### 消费

`browse events` 对应 `GET /events`，回执：

| 字段 | 含义 |
| --- | --- |
| `events` | 环内事件。每条可含 `cta` |
| `next` | 当前最高优先建议。`challenge-stop` 等优先于采集技能；同级取最新 |
| `nextSeq` | 下一轮 `since` 游标 |

`stop` 无 cta。环容量 1000。

### goto / detect 回执

`@detect` 返回 `{slug, confidence}`，`confidence` 为 `CONFIRMED` 或 `PLAUSIBLE`。slug 在上表时，回执附加：

- `page_skills`：命中列表
- `page_skills_hint`：`browse workspace page <slug>（跑:browse rune page-skills/<slug>/mech.rn）`

与事件环独立。名单外 slug 不会被自动点名。

## probe 约定

- 头：`@match`、`@connect 127.0.0.1`、`@grant GM_xmlhttpRequest`、`@run-at`
- `@detect` 返回 `{slug, confidence}` 或 `null`；不改 DOM、不发请求
- 大结果留页面内存，mech 用 `cdp::js` 读走

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
