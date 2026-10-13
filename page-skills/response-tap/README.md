# response-tap

document-start 钩页面 `fetch`/`XHR`(clone 后读),并记下 `window.open`、`WebSocket`、`EventSource` 的 URL。缓冲在 `__browseTap`(单条 256KB,共 2000)。环上只打摘要 `{hit,status,bytes,topKeys}`。过滤:`window.__RT_FILTER`。mech 结束时读走缓冲。源 `build/pairs/response-tap/`。
