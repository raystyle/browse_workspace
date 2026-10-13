# x-search

x.com 实时搜索。源 `build/pairs/x-search/`。

```bash
browse userscript install page-skills/x-search/probe.user.js --restart
browse rune page-skills/x-search/mech.rn --vars q=OpenAI --vars rounds=2
```

探针扫 `article`,正文优先 `[data-testid="tweetText"]`,写入 `probe`。编排打开 `https://x.com/search?q=...&f=live`,250ms 看收齐,约 10 秒后 `reload` 再收一轮。后出现的状态 id 标 `fresh`。`rounds` 缺省 2,上限 4。

`verdict`:ok / login(` /login`、`/i/flow/login`、`/i/jf/`) / net(导航 `net::`、chrome-error、或时间线「出错了 / Something went wrong」且无帖,最多再开两次) / empty(无匹配帖)。不发帖、不点赞。只走显式 rune。
