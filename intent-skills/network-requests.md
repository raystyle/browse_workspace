# 网络观测

场景：DOM 撒谎时判断请求是否发出、发了什么、回了什么；SPA 操作成败信号。

- 摘要：`requests({filter})`（环形 1000 条 {index,url,status,type,bytes}；index 与 requestDetail 传同 filter 严格对齐）
- 详情：`requestDetail(index 或 requestId)`（url/status/mimeType/headers/bytes）；响应体另走 `responseBody(requestId)`（base64 自动解码，可解析附 json）
- 等单个响应：`waitForResponse(pattern, s)`（glob 写法同 routeBlock；回执含 body 与 json；只认活动 tab）
- SPA「保存成功」信号：`clickRef` 后 `waitForResponse("/api/save")`，比 DOM 轮询干净
- 拦截三件：`routeBlock(pattern)`（命中即失败 BlockedByClient）、`routeMock(pattern, body, opts)`（本地应答，opts.headers 可加 Content-Disposition 触发下载）、`routeClear()`（用完即清：Fetch.enable 会禁 HTTP 缓存）
- 请求体：`peekEvents`/`findEvents` 取 Network.requestWillBeSent 的 params.request.postData（小体直取）；大体裸调 Network.getRequestPostData
- 陷阱：Network 域随 tab 入口自动开，开域前的旧请求收不到；requestId 单 target 内唯一，别跨 tab 用；waitForResponse 幂等开也收不到已发出的响应，方言无并发，正确形态是先触发后等待；引擎层替代 `engineWaitForResponse`（登记即回不阻塞，扩展域版引擎）
