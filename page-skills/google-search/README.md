# google-search

Google SERP 判读与结果页采集。生成物，源在 `build/`，改 TS 后 `pnpm build`。

```bash
browse userscript install page-skills/google-search/probe.skeleton.user.js page-skills/google-search/probe.heavy.user.js --restart
browse rune page-skills/google-search/mech.rn --vars q=rust language --vars top=5
browse rune page-skills/google-search/mech.rn --vars q=rust language --vars top=5 --vars mode=follow --timeout 180
```

- `q`、`top`(1-10) 必填
- `mode` 缺省 `serp`：只收 SERP。`follow`：再开标签访问结果页，内容两拍相同才收，导航预算 1 SERP + ≤5 goto，超限 `verdict=budget`
- 骨架 `document-start`：采样、收齐、verdict、上报。重段 `document-idle`：settled 后把 SERP 与 AI Overview 转 md，写回同一 `probe` 属性
- `verdict`：`ok` / `consent` / `challenged` / `empty` / `budget`
- 结果锚若是 `google.com/goto?url=`，记 `wrapped:"goto"`，真址在 `pages[].finalUrl`
