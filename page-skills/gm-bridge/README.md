# gm-bridge

油猴世界的 `GM_xmlhttpRequest` 经 DOM 事件供给其他世界。

请求:`browse-gm-req` `{id, kind:'fetch', url, ...}`。响应:`browse-gm-res`。就绪:`us-gm-bridge=ready`。

`ALLOW_FETCH` 写在探针源码里,缺省 `http://127.0.0.1:8872/`。不匹配回 `{ok:false, error:'deny'}`,不调 GM。空表全拒。`kv-get` / `kv-set` 同样 deny。改表要改探针再装。`@match` 仅 `http://127.0.0.1:8871/*`。
