# google-search

Google SERP 判读与目标页研究对(REQ-035 双脚本对形;REQ-041 P0 两段式首对)。Phase 1 零 browse 发版:显式 `browse rune` 与 userscript 安装道不吃 FROZEN_PAGE_SLUGS 白名单。

> **生成体系(con-06 用户令:定好契约,编译生成)**:`mech.rn` 与 `probe.skeleton.user.js`/`probe.heavy.user.js` 是生成物,勿手改(手改会被下次 build 覆盖)。源在 `build/`:契约唯一权威 `contracts.ts`(zod schema + 通道常量 + 三要素帽 + 选择器;消费 `framework/` SDK 基),`probe.skeleton.ts`(骨架段真体)与 `probe.heavy.ts`(重段真体)加各自 `.head.txt`,`mech.bodies.ts`(mech 逐体 TS 函数),`mech.template.rn`(rune 骨架槽),`build.mts`(esbuild 生成器,`tsx build/build.mts [pair]` 参数化)。改逻辑 = 改 TS 后 `pnpm build`;tsc 即 lint,esbuild 即语法保证。

## 两步调用

```bash
browse userscript install page-skills/google-search/probe.skeleton.user.js page-skills/google-search/probe.heavy.user.js --restart
browse rune page-skills/google-search/mech.rn --vars q=rust language --vars top=5 > research.json
```

- 双件一道装机(多文件 install);骨架沿用旧单件 `@name`,装机即原位替换旧 `probe.user.js`,heavy 是新增条目
- `q`:查询词(URL 编码由 mech 页面侧 encodeURIComponent 处理)
- `top`:跟进访问的目标页条数(1-10;SERP 判读自身恒取前 10,请求恒 num=10,num<10 实测缩自然结果)
- 两个 vars 都必填,缺即 exit 2(模板键网络前拦)
- 实测时耗:温机约 8s(top=5:快取 URL ~1s + 标签并行加载 + 轮签提取)

## 探针两段式(REQ-041 P0 / gr01-R3)

旧单件 338KB(内嵌 mdream WASM)在 document-start 全量解析是注入面浪费。拆两段:

| 段 | 件 | @run-at | 体积 | 职责 |
| --- | --- | --- | --- | --- |
| 骨架 | `probe.skeleton.user.js` | document-start | ~9.5KB(门 ≤20KB) | 指纹采样、收齐引擎(两拍稳定)、verdict 判读(唯一判读方)、`/events` 上报、AI Overview 文本面(watchAi) |
| 重段 | `probe.heavy.user.js` | document-idle | ~330KB(内嵌 vendored mdream) | settled 信号触发后 SERP md + AI overview md 富集,写回同一 `probe` attr |

- 通道零变:两段写同一 `probe` attr;skeleton 终写(整包重建)后 heavy 才补富集字段(`markdown`/`converter`/`md_ts`/`ai_overview.markdown`),时序由「两腿都等 settled」保证:终写前富集会被整包重建抹掉(实测踩过:引擎晚批注入时首写即带 `ai_overview.present:true`)
- 引擎晚批注入形态(clean-chrome `OnScripts`):脚本清单应答晚到时 start/idle 两桶同批注入(load 已完即注);heavy 对骨架缺席不弃,有界等 attr 首现(heavySettleAwait 帽)
- heavy 零 GM 面(纯 DOM + 内嵌转换器);骨架缺席/未收齐即静默退出,attr 保持 `heavy-pending` 如实
- `converter` 语义:`heavy-pending`(ok 且富集未落)后接 `mdream@2.0.1/minimal|clean|plain`(成功,降级链序)或 `failed*`(如实失败);非 ok verdict 恒 `skipped-<verdict>`,不富集不假绿

## 流程与机制(用户令 con-06 系裁定)

1. **快取结果**:裸 Page.navigate 不等 SERP load 尾;probe(document-start 注入)以结果指纹稳定(≥500ms 不变)判收齐,attr 带 `settled:true` 并向 daemon `/events` 发一次回调(携完整 url 列表);mech 挂 attr 观察器,写入即走不计时轮询
2. **cdp 开标签访问结果页**:空签批量建、逐签点火导航(加载并行)、轮签等 `readystatechange-complete` 事件取**渲染内容**(`finalUrl` 即 goto 包裹跟跳后的真址)、回原签统一关访问签
3. SERP 摘要:heavy 段(油猴世界)vendored mdream 转 markdown(不吃页面 CSP,con-06-add1),settled 后异步补写,mdRace 竞速帽(4s/次)+ minimal、clean、plain 降级链
4. **AI Overview 采集**:AI 分析块流式晚到;settled 后骨架挂 MutationObserver 事件道(变更重置待稳,文本两拍稳 ≥1.2s 即收,10s 帽),文本落 attr 后 heavy 补块级 mdream 摘要;收不到即 `present:false` 不假绿

## 返回 schema(单 JSON)

```json
{
  "probe": {
    "verdict": "ok|consent|challenged|empty",
    "drift": "none|suspected",
    "mainHits": 8, "fallbackHits": 0, "settled": true,
    "results": [{ "title": "…", "url": "https://…", "wrapped": "goto|null", "snippet": "…", "via": "main|fallback" }],
    "markdown": "SERP 摘要(mdream)", "converter": "mdream@2.0.1/minimal|heavy-pending|failed|…",
    "ai_overview": { "present": true, "text": "AI 分析块(≤4K)", "markdown": "块级 mdream 摘要", "converter": "…" },
    "probe_debug": […时间线…], "v": "选择器版本", "url": "SERP 地址", "ts": 0
  },
  "pages": [{ "url": "请求址(goto 包裹或直址)", "finalUrl": "跟跳后真址", "title": "…", "ready": "complete", "text": "渲染文本(≤12K)", "html": "渲染 HTML(≤16K)" }],
  "errors": []
}
```

## verdict 与稳定性语义

- **挑战终态即证据**:`verdict=challenged`(probe 见 turnstile/captcha/sorry)或 `consent`(同意墙,mech 合成点击接受后重读,仍卡即保持)如实回执,**不设 HTTP 抓 google 兜底、不假绿**
- **goto 包裹(2026-10 新 SERP 形)**:结果锚 href 是 `google.com/goto?url=<opaque>` 服务端跟跳包装,结果记 `wrapped:"goto"`;真址由标签访问落定(`pages[].finalUrl`)。经典 `/url?q=` 形就地解包
- **漂移检测**:主道(`#search/#rso` h3 锚)零命中而兜底道(外链锚含 h3 启发式)命中即 `drift=suspected`;选择器版本在 `probe.v`,连续 2 次 suspected 即该升选择器
- **mdream 失败不假绿**:`converter=failed*`,`markdown=null`
- 成功判据(验收用):`results>=5 且 verdict=ok 且 drift=none`

## 调试面

`probe.probe_debug` 时间线:注入时 readyState(`sk:inject:*`)、heavy 富集各态(`hv:md:*`/`hv:ai:*`,经 attr 增量并入)。挂起直读 research.json 定位,不猜。

## 升级

`browse workspace update`(或仓内 git pull)后重跑两步调用(双件 install);mdream 钉 2.0.1 exact(`scripts/vendor/`,sha256 边车 + MIT LICENSE),升版换 vendor 三件套同批。

> 已知消费面缺口(2026-10-11 记):browse_rs `workspace.rs` 成对判定尚认 `probe.user.js` 单件名,本对双件形暂不从 `browse workspace list` 对册露出(detect 热路径同);browse 侧适配另立批次(REQ-041 Notes 裁)。
