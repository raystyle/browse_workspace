# response-tap

响应采集对(爬虫类主力)。probe 的 document-start 旁路钩 fetch/XHR
(clone 后读,不改页面看到的响应),全量缓冲留页面内存(单条 256KB/总数
2000 护栏),环只打 see.response-tap 摘要 {hit,status,bytes,topKeys};
URL 过滤经 `window.__RT_FILTER`(子串数组,mech 或调用方在采集前设)。
mech 结束时 `cdp::js` 一次读走缓冲,返回值即导出。素材:MiddleMan(MIT)
的旁路读法、intercept/ajax-hooker 的钩形(X 检索轮;LGPL/GPL 件不抄)。
必须装(profile 或 mech 注入 document-start)才听得到请求。
