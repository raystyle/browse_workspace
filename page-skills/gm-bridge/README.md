# gm-bridge

GM 服务桥对(六向增强之②):油猴世界的 GM 特权(跨域 XHR 带引擎会话
cookie、跨导航持久 KV)经 **DOM CustomEvent RPC** 暴露给任意世界
(三世界 DOM 共享、JS 对象不通,事件是唯一双向道——2026-10-10 实测:
window 变量三世界互不可见,attr 三世界皆可读)。

请求:`document.dispatchEvent(new CustomEvent('browse-gm-req',
{detail:{id, kind:'fetch'|'kv-get'|'kv-set', ...}}))`;
响应对 id 回 `browse-gm-res`。就绪标记 `us-gm-bridge=ready` 属性。
mech.rn 是跨域取数演示(8871 页取 8872,页面 fetch 必被 CORS 拦)。
安全注:桥在油猴世界,页面主世界**也能** dispatch 请求事件(事件道
对页面开放)——fetch 白名单不在本对(接受本机任意目标),敏感场景
应在对内加 URL 白名单后再暴露。
