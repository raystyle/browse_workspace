# page-skills：页面特征机制配方

一文件一机制配方，文件名（slug）是 goto 触发层的点名键。slug 是**可检测的页面特征**而非机制名：检测不到的不进触发层（uploads/downloads/dialogs 类意图配方归 intent-skills/）。

## 首发 10 slug（冻结清单）

| slug | 检测信号 | 置信档 |
| --- | --- | --- |
| spa | 框架容器键或全局（react/vue/angular/svelte/qwik/ember） | CONFIRMED |
| hydration | `__next_f` / `__NUXT_DATA__` / astro-island / `[q:container]` | CONFIRMED |
| shadow-dom | 前 800 节点内 shadowRoot 命中 | CONFIRMED |
| iframe | iframe 清单非空 | CONFIRMED |
| iframe-cross-origin | 跨源 iframe 判定命中 | CONFIRMED |
| lazy-scroll | 页高 >= 8 倍视口加滚动容器窗口特征 | PLAUSIBLE |
| bot-shield | cf-chl 类 DOM（CONFIRMED）或 CF cookie（PLAUSIBLE） | 双档 |
| login-wall | 可见 password 框（登录骨架信号未实现，误点名常见于登录框常驻页头） | PLAUSIBLE |
| captcha | recaptcha/hcaptcha/turnstile 特征 | CONFIRMED |
| service-worker | navigator.serviceWorker.controller | CONFIRMED |

框架名与版本是回执 info 字段（framework: {name, version}），不占 slug；仅当特征导致行为分叉才配 slug（水合窗口期为 next/nuxt/qwik/astro 特有，故 hydration 独立成 slug）。

## 触发机制

goto 成功后 browse 在页内跑一次有界探测（前 800 节点封顶），命中则回执附 `page_skills`（slug 列表带置信档）与 `page_skills_hint`（读全文命令）。置信档语义：DOM 特征 CONFIRMED（拿得住），cookie 类软信号 PLAUSIBLE（agent 权衡）。`BROWSE_PAGE_SKILLS=0` 关闭整层。

## 写作规约

- 首行 `# <机制>`，先一句「什么时候会点名到本篇」
- 正文给 browse 方言配方（snapshot/clickRef/pageEval/mouseWheel），不给裸 CDP 长例
- 「陷阱」节收束已验证的坑；版本相关的行为标注引擎版本
