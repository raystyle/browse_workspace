# browse_workspace

browse 技能仓。每项技能由 Rune 编排脚本 `mech.rn` 与页内探针 `probe.user.js` 成对构成。

browse 驾驶面分三层：命令方言提供单步原语（不含控制流）；Rune 提供图灵完备编排；命令从 stdin 读取脚本或参数。本仓提供 Rune 脚本与探针。

`mech.rn` 入口为 `pub async fn main() -> Result`，可循环、分支、异步等待，通过 `cdp::goto`、`cdp::js`、`cdp::raw`、`cdp::dialect` 操作浏览器。探针负责页内观察与事件。

```bash
browse rune page-skills/<slug>/mech.rn --vars k=v
cat plan.rn | browse rune
```

## 模板变量

`--vars k=v` 可重复。与 `@` 脚本路径同用，或直接作用于含槽位的 `mech.rn`。按 Jinja 渲染，默认定界 `<%= 键 %>`（`--vars-syntax classic` 为 `{{ 键 }}`）。未提供的键在执行前以退出码 2 拒绝。值均为字符串。

示例：`<%= q %>`、`<%= rounds | default(2) %>`。

## 结构

```
page-skills/
  _prelude.js            # 判定 facts 与 window.__probe
  <slug>/mech.rn         # Rune 编排
  <slug>/probe.user.js   # userscript 探针（含 @detect 与运行时）
build/                   # 生成器与 TypeScript 源
  pairs/<slug>/          # 单件源：probe.head.txt、probe.body.ts、mech.rn
scripts/vendor/          # mdream 钉版
domain-skills/<segment>/ # 域名技能，目录名为域名首段
scripts/                 # JavaScript 小程序（@ 实参与 --vars）
```

google-search 为两段式探针：`probe.skeleton.user.js`（`document-start`）与 `probe.heavy.user.js`（`document-idle`，内嵌 mdream）。其余单件由 `pnpm build` 从 `build/pairs/<slug>/` 生成到 `page-skills/`。antibot-vendor 与 gm-bridge 为手写源，不经生成器。

## 命令

| 用途 | 命令 |
| --- | --- |
| 页面判定 | `goto` / `detect` 拼接各技能的 `@detect` 与 `_prelude.js`，在主世界求值一次。两段式技能的 `@detect` 位于 skeleton |
| 查看说明 | `browse workspace page <slug>`；`browse workspace site <segment>` |
| 运行编排 | `browse rune page-skills/<slug>/mech.rn` |
| 安装探针 | `browse userscript install <file...> --restart` |
| 读取事件 | `browse events` |

## 事件与 cta

探针通过 `GM_xmlhttpRequest` 向 daemon 上报。页面 `fetch` 受 CORS 限制。端口为安装时替换的 `%%BROWSE_PORT%%`；未替换时为 `9880`。

### 上报

| 端点 | 作用 | 请求体 |
| --- | --- | --- |
| `POST /events` | 观察（`type: see`） | `{type, slug, url, data, action}` |
| `POST /userscript/stop` | 中断正在执行的 `mech.rn` | `{slug, url, data}` |

`action` 仅允许 `read`、`rune`、`export`。探针不得在请求中携带命令文本。`stop` 不关闭浏览器、不关闭 daemon、不清空事件环。若当前没有正在执行的 rune，事件入环并返回 `stopped: false`。

`window.__probe`（定义于 `_prelude.js`）提供下列接口：

| 方法 | 作用 |
| --- | --- |
| `R.see({slug, action, data, once, throttleMs})` | `POST /events` |
| `R.stop(slug, data)` | `POST /userscript/stop` |
| `R.tap(name, fn)` | 在页内拦截 `fetch` / `XHR`，回调 `{url, body, status, kind}`，不上报 daemon |
| `R.route(fn)` | 在页内监听 `pushState` / `replaceState` / `popstate` / `hashchange`，回调 `{kind}`，并清空 see 去重表 |
| `R.rearm()` | 清空 see 去重表 |

`goto` 完成后，判定批处理将 `__probe` 注入主世界。若探针以 `document-start` 运行且早于该注入，应等待 `__probe` 可用后再登记。部分探针直接调用 `GM_xmlhttpRequest`，不经过 `R.see`。

### cta 生成条件

daemon 根据 `slug` 与 `action` 生成 `cta`：

| action | cta |
| --- | --- |
| `read` | `browse workspace page <slug>` |
| `rune` | `browse rune page-skills/<slug>/mech.rn` |
| `export` | `browse rune page-skills/<slug>/mech.rn` |

仅下列 slug 生成 `cta`。其他事件仍写入事件环，但不含 `cta` 字段：

`response-tap`、`scroll-until-end`、`next-page`、`spa-route`、`link-table`、`challenge-stop`、`antibot-vendor`、`fingerprint-watch`、`policy-surface`

缺少 `action`、`action` 非法、或 slug 不在上列：事件保留，无 `cta`。`google-search`、`x-search`、`gm-bridge`、`human-gate` 不在上列。

同一 `(slug, action)` 在 2 秒内重复的 see 不入环，响应为 `{ok: true, throttled: true}`。`R.see` 默认按 `slug|action|pathname` 去重；`R.route` 在路径变更后允许再次上报。

### 消费

`browse events` 对应 `GET /events`：

| 字段 | 含义 |
| --- | --- |
| `events` | 事件列表。条目可含 `cta` |
| `next` | 当前最高优先级建议。`challenge-stop` 优先于采集类技能；同级取最新 |
| `nextSeq` | 下一轮查询的 `since` 游标 |

`stop` 不含 `cta`。事件环容量为 1000。

### 域名段（`goto` / `fetch`）

从 URL 取 host，去掉 `www.` 前缀，再取第一段作为域名段。例如 `https://www.x.com/a` → `x`。仅 `http`/`https` 参与匹配。

若技能仓存在 `domain-skills/<段>/`，且其中文件成对（`mech.rn` 与 `probe.user.js`），回执附加：

| 字段 | 内容 |
| --- | --- |
| `domain_skills` | 该段目录下的文件名列表 |
| `domain_skills_hint` | `browse workspace site <段>` |

`fetch` 在 CLI 侧按 URL 匹配，不依赖引擎。`BROWSE_DOMAIN_SKILLS=0` 时不附加。目录不存在或不成对则不附加。

### 页面 slug（`goto` / `detect`）

`goto` 后将各探针 `@detect` 与 `_prelude.js` 拼成一次主世界求值。`@detect` 返回 `{slug, confidence}`，`confidence` 为 `CONFIRMED` 或 `PLAUSIBLE`。`detect()` 的 `challenged` 判读映射为 `challenge-stop`（PLAUSIBLE）。

slug 属于 cta 白名单时，回执附加：

| 字段 | 内容 |
| --- | --- |
| `page_skills` | 命中列表 |
| `page_skills_hint` | `browse workspace page <slug>（跑:browse rune page-skills/<slug>/mech.rn）` |

`BROWSE_PAGE_SKILLS=0` 时不附加。白名单外的 slug 不出现在回执中。域名段提示、页面 slug 提示、事件环 `cta` 三者相互独立。

## 探针约定

Userscript 元数据须包含 `@match`、`@connect 127.0.0.1`、`@grant GM_xmlhttpRequest`、`@run-at`。

`@detect` 返回 `{slug, confidence}` 或 `null`，且不得修改 DOM、不得发起网络请求。体积较大的结果保存在页面内存中，由 `mech.rn` 通过 `cdp::js` 读取。

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

`pnpm check`、`pnpm facts`、`pnpm typecheck`。测试数据位于 `tests/fixtures/`。
