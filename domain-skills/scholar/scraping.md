# scholar.google.com — 搜索结果采集

> 来源：project-evo-94 咨询单实测读数（2026-10-17，E:\intelligence 会话，browse 引擎真跑）。
> 三态判别原语与 SERP_STATE 片段见 [google/search.md](../google/search.md)（知识本体同构，锚点集不同）。

## 实测态（2026-10-17）

`goto scholar.google.com/scholar?q=<query>&hl=en` 后读状态：
`{"serp": true, "challenge": false, "captcha": false, "n": 10}` —— SERP 真、无挑战墙、无验证码、满页 10 条。
当前引擎 profile 下**直通可用**，无需探针与特殊退避。「Scholar 反爬比主面凶」的保守推测被实测推翻；
验证码墙在更高频/更可疑流量下仍可能出现，判别片段照常收 challenge/captcha 态。

## 锚点集

| 用途 | 选择器 |
| --- | --- |
| 结果行 | `#gs_res_ccl_mid .gs_r` |
| 结果容器 | `#gs_res_ccl` |

## 采集形

- goto 方言（自带提交等待）+ `--js` 抽取即可，轻量高频面不值 mech/探针；
- 三态片段换本面锚点即可判 anti-bot / shell / real-empty（real-empty 不重试）；
- 引用卡片（右侧 `[CITATION]`/`[PDF]` 链接）在结果行内，随行抽取。

## 关联

- 主面知识：[google/search.md](../google/search.md)
- 判据脚本化（若需 mech）：走本仓提交通道，`google-search` mech 的 serp 模式换域即可打 verdict。
