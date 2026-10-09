# fingerprint-watch

指纹 API 调用观察对(安全类,只计数不改返回值)。常驻腿 document-start 包
canvas/audio/字体/webdriver 读,页面生命周期结束(或 8 秒窗)打一次
see.fingerprint-watch 摘要 {apis:[{name,count}]}。不设 @detect 腿(指纹
脚本在正常页也跑,不构成页面特征点名)。对照 CreepJS 的问题定义(MIT,
不抄其测试集与名称)。要装(profile 常驻或 mech 注入)才有观察。
