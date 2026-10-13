# x-search

x.com 实时搜索对。`probe.user.js` 与 `mech.rn` 是生成物(`tsx build/build.mts x-search`),源在 `build/pairs/x-search/`,勿手改。

探针在 `document-idle` 扫描 `article`,用 `[data-testid="tweetText"]` 取正文,写入 `probe` 属性。编排打开 `https://x.com/search?q=...&f=live`,每 250ms 看一次收齐信号,最多约 10 秒;然后 `location.reload()` 再收一轮。后出现的状态 id 标 `fresh`。

```bash
browse userscript install page-skills/x-search/probe.user.js --restart
browse rune page-skills/x-search/mech.rn --vars q=OpenAI --vars rounds=2
```

`rounds` 缺省 2,上限 4。未登录(路径 `/login`、`/i/flow/login`、`/i/jf/`)回 `verdict=login`。网络失败(`Page.navigate` 的 `net::`、页面落在 `chrome-error`、或时间线出现「出错了 / Something went wrong」且没有帖子)最多再打开两次,仍失败回 `verdict=net`,不报成空结果。没有匹配帖子的搜索页仍回 `verdict=empty`。不发帖、不点赞。不进 browse 点名白名单,只走显式 rune。
