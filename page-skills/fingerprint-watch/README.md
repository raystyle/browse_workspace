# fingerprint-watch

观察 canvas、audio、字体、webdriver 的调用次数，不修改返回值。`document-start` 安装挂钩；页面卸载或 8 秒窗口结束时上报一次 `see.fingerprint-watch`，数据为 `{apis:[{name,count}]}`。无 `@detect`，不出现在判定回执中。须安装探针后才会观察。
