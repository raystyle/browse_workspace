# gm-bridge

GM 服务桥对(六向增强之②):油猴世界的 GM 特权(跨域 XHR 带引擎会话
cookie、跨导航持久 KV)经 **DOM CustomEvent RPC** 暴露给任意世界
(三世界 DOM 共享、JS 对象不通,事件是唯一双向道——2026-10-10 实测:
window 变量三世界互不可见,attr 三世界皆可读)。

请求:`document.dispatchEvent(new CustomEvent('browse-gm-req',
{detail:{id, kind:'fetch', url, ...}}))`;
响应对 id 回 `browse-gm-res`。就绪标记 `us-gm-bridge=ready` 属性。
mech.rn 是跨域取数演示(8871 页取 8872,页面 fetch 必被 CORS 拦;
GM_xhr 本身免 CORS,2026-10-10 复测达标,无需目标 ACAO 配合——
桥的意义在把 GM 特权暴露给任意世界(rune/主世界),非仅跨域)。

白名单写在 `probe.user.js` 的 `ALLOW_FETCH` 前缀表,不读事件、不读 DOM
(页面主世界也能发 `browse-gm-req`,经事件传入的表可以被换成任意 URL)。
缺省只有 `http://127.0.0.1:8872/`。不匹配的 fetch 回 `{ok:false, error:'deny'}`,
不调用 `GM_xmlhttpRequest`。空表即全部拒绝。改表要改探针再装。
`kv-get` / `kv-set` 缺省拒绝,同一 `error:'deny'`。仓内没有调用方。
