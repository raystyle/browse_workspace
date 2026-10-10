# google-search

Google SERP 判读与目标页研究对(REQ-035 双脚本对形)。Phase 1 零 browse 发版:显式 `browse rune` 与 userscript 安装道不吃 FROZEN_PAGE_SLUGS 白名单。

## 两步调用

```bash
browse userscript install page-skills/google-search/probe.user.js --restart
browse rune page-skills/google-search/mech.rn --vars q=rust language --vars top=5 > research.json
```

- `q`:查询词(URL 编码由 mech 页面侧 encodeURIComponent 处理)
- `top`:跟进访问的目标页条数(1-10;SERP 判读自身恒取前 10,请求恒 num=10——num<10 实测缩自然结果)
- 两个 vars 都必填,缺即 exit 2(模板键网络前拦)
- 实测时耗:温机约 8s(top=5:快取 URL ~1s + 标签并行加载 + 轮签提取)

## 流程与机制(用户令 con-06 系裁定)

1. **快取结果**:裸 Page.navigate 不等 SERP load 尾;probe(document-start 注入)以结果指纹稳定(≥500ms 不变)判收齐,attr 带 `settled:true` 并向 daemon `/events` 发一次回调(携完整 url 列表);mech 挂 attr 观察器,写入即走不计时轮询
2. **cdp 开标签访问结果页**:空签批量建 → 逐签点火导航(加载并行)→ 轮签等 `readystatechange-complete` 事件取**渲染内容**(`finalUrl` 即 goto 包裹跟跳后的真址)→ 回原签统一关访问签
3. SERP 摘要:probe 在油猴世界用 vendored mdream 转 markdown(不吃页面 CSP,con-06-add1),异步补写不卡收齐信号

## 返回 schema(单 JSON)

```json
{
  "probe": {
    "verdict": "ok|consent|challenged|empty",
    "drift": "none|suspected",
    "mainHits": 8, "fallbackHits": 0, "settled": true,
    "results": [{ "title": "…", "url": "https://…", "wrapped": "goto|null", "snippet": "…", "via": "main|fallback" }],
    "markdown": "SERP 摘要(mdream)", "converter": "mdream@2.0.1/minimal|failed|…",
    "probe_debug": […时间线…], "v": "选择器版本", "url": "SERP 地址", "ts": 0
  },
  "pages": [{ "url": "请求址(goto 包裹或直址)", "finalUrl": "跟跳后真址", "title": "…", "ready": "complete", "text": "渲染文本(≤12K)", "html": "渲染 HTML(≤16K)" }],
  "errors": []
}
```

## verdict 与稳定性语义

- **挑战终态即证据**:`verdict=challenged`(probe 见 turnstile/captcha/sorry)或 `consent`(同意墙,mech 合成点击接受后重读,仍卡即保持)如实回执,**不设 HTTP 抓 google 兜底、不假绿**
- **goto 包裹(2026-10 新 SERP 形)**:结果锚 href 是 `google.com/goto?url=<opaque>` 服务端跟跳包装,结果记 `wrapped:"goto"`;真址由标签访问落定(`pages[].finalUrl`)。经典 `/url?q=` 形就地解包
- **漂移检测**:主道(`#search/#rso` h3 锚)零命中而兜底道(外链锚含 h3 启发式)命中 → `drift=suspected`;选择器版本在 `probe.v`,连续 2 次 suspected 即该升选择器
- **mdream 失败不假绿**:`converter=failed*`,`markdown=null`
- 成功判据(验收用):`results>=5 且 verdict=ok 且 drift=none`

## 调试面

`probe.probe_debug` 时间线:注入时 readyState、指纹变化、settle 触发原因(stable/pageDone/cap)、md 各态、events 上报——挂起直读 research.json 定位,不猜。

## 升级

`browse workspace update`(或仓内 git pull)后重跑两步调用;mdream 钉 2.0.1 exact(`scripts/vendor/`,sha256 边车 + MIT LICENSE),升版换 vendor 三件套同批。
