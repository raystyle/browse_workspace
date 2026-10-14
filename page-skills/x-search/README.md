# x-search

x.com 实时搜索。源 `build/pairs/x-search/`。

```bash
browse userscript install page-skills/x-search/probe.user.js --restart
browse rune page-skills/x-search/mech.rn --vars q=OpenAI --vars rounds=2
```

探针扫描 `article`，正文优先取 `[data-testid="tweetText"]`，写入 `probe`。编排打开 `https://x.com/search?q=...&f=live`，每 250ms 检查是否收齐；约 10 秒后 `reload` 再采集一轮。本轮新出现的状态 id 标记为 `fresh`。`rounds` 默认 2，上限 4。

`verdict`:ok / login(` /login`、`/i/flow/login`、`/i/jf/`) / net(导航 `net::`、chrome-error、或时间线「出错了 / Something went wrong」且无帖,最多再开两次) / empty(无匹配帖)。不发帖、不点赞。只走显式 rune。
