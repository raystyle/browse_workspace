# gm-bridge

将油猴隔离世界的 `GM_xmlhttpRequest` 通过 DOM 事件提供给其他世界。

请求事件为 `browse-gm-req`（`{id, kind:'fetch', url, ...}`），响应事件为 `browse-gm-res`，就绪标记为 `us-gm-bridge=ready`。

`ALLOW_FETCH` 写在探针源码中，默认 `http://127.0.0.1:8872/`。未匹配时返回 `{ok:false, error:'deny'}`，不调用 `GM_xmlhttpRequest`。空表拒绝全部请求。`kv-get` 与 `kv-set` 同样拒绝。修改白名单须改探针并重新安装。`@match` 仅 `http://127.0.0.1:8871/*`。
