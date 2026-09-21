# cookie 与存储

场景：登录态检查、会话预载、跨实例迁移登录。

- 读：`cookies(domain?)`（无参等于当前页 URL 作用域非全 jar，跨域清单逐域调）、`cookieGet(name)`（按 name 精确匹配，同名跨域取第一条；要确定域用 cookies(domain) 再筛）
- 写删：`cookieSet(name, value, opts)`（缺 domain 走当前页 URL，回 success 布尔）、`cookieDelete(name, domain?)`（CDP 无单数形，同域同名多 path 一起清）、`cookiesClear()`（清整浏览器全部 cookie，破坏性动作）
- Web 存储：localGet/localSet/localDelete/localClear 与 sessionGet/sessionSet/sessionDelete/sessionClear（当前域；localClear 不动 sessionStorage）；写入即回读验证
- 整包往返：`exportStorageState()`（cookies 全量加当前页 origin 的 localStorage；多 origin 逐个切 tab 再导）/ `importStorageState(state 或 path)`
- 从附着浏览器热迁：`cloneCookies(domains)`（只读源零写回铁律；域后缀匹配；无附着源报错指 storageState 整包往返）；up 的 --cookies 域 csv 是同一道的 CLI 面
- 陷阱：Network.setCookie 域不匹配时静默假成功（仍回 success:true 实未写入）：cookieSet 后回读验证；expires 是秒不是毫秒；清 cookie 不清 localStorage，完整登出要两清
