# response-tap

在 `document-start` 拦截页面 `fetch` 与 `XHR`（clone 后读取），并记录 `window.open`、`WebSocket`、`EventSource` 的 URL。缓冲位于 `__browseTap`（单条上限 256KB，最多 2000 条）。事件环仅上报摘要 `{hit,status,bytes,topKeys}`。过滤条件为 `window.__RT_FILTER`。`mech.rn` 结束时读取缓冲。源位于 `build/pairs/response-tap/`。
