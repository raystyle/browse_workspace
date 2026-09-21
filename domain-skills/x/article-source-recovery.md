# x：公开 status 的 Article 卡片与规范源恢复

x.com 公开帖（`x.com/<handle>/status/<id>`）带 X Article 卡片时，卡内正文路由对匿名浏览器跳登录，别据此判帖子私有。前代 bh 实测口径，用时按需复验。

## 公开 status 的锚点清点

公开 status 页匿名可渲染帖子与卡片本体；点卡前先清点文章内锚点：

```js
pageEval("JSON.stringify(Array.from(document.querySelectorAll('article a')).map(a => ({text: (a.innerText || '').trim(), href: a.href})).filter(x => x.href))")
```

X Article 卡片常指向 `https://x.com/i/article/<id>`；匿名访问该路由跳 `x.com/i/jf/onboarding/web?...mode=login` 属常态，不是帖子私有或已删的证据。

## 跨发兜底

作者常把同一文章交叉发到 LinkedIn 或个人站并留链接：登录弹窗盖住页面时，公开正文与锚点仍在 DOM。

```js
pageEval("JSON.stringify({description: document.querySelector('meta[name=\"description\"]')?.content || null, links: Array.from(document.querySelectorAll('a')).map(a => ({text: (a.innerText || '').trim(), href: a.href}))})")
```

LinkedIn 的外链形如 `linkedin.com/redir/redirect?url=<编码>`：解 `url` 参数拿规范 URL 直开，在规范页验证标题与正文。

## 守卫

- 一手源 = status 页与作者自控的规范页；评论区与搜索摘要只作旁证
- 恢复不出规范页就如实引公开 status 并标注 Article 正文不可达，不从评论拼正文
- 登录墙不绕：要凭据让用户自己输（登录面见 posting.md）
