# medium：只读数据面（API 优先）

medium.com 只读任务恒先走 HTTP 通道（`browse fetch` / RSS / GraphQL），浏览器只留给登录态动作（clap、发文、会员文渲染）。

## 通道选择

| 目标 | 通道 | 参考时延 |
| --- | --- | --- |
| 文章元数据加全文 | `?format=json` | ~400ms |
| 指标单项（claps 等） | GraphQL `post(id:)` | ~275ms |
| 作者档案加粉丝数 | GraphQL `user(username:)` | ~220ms |
| 用户/出版物最近文章（带指标） | `?format=json` 于 profile/publication URL | ~300ms |
| 最近文章带全文 HTML | RSS feed | ~260ms |

## ?format=json

任意文章、用户主页、出版物 URL 加 `?format=json`：

```bash
browse fetch 'https://medium.com/@karpathy/software-2-0-a64152b37c35?format=json'
```

- 回执 httpStatus 403 但正文仍是完整 JSON：403 不当失败，剥 XSSI 前缀 `])}while(1);</x>` 再解析（宿主侧 slice 到首个 `{`，或 pageEval 正则）
- 关键字段：`payload.value`（title / id / creatorId / uniqueSlug / canonicalUrl / firstPublishedAt 毫秒 / isSubscriptionLocked / visibility 0=公开 2=锁）；`payload.value.virtuals`（totalClapCount 总拍数 / recommends 独立拍者 / readingTime 分钟 / wordCount / tags）；`payload.references.User[creatorId]` 作者名与 handle；`references.SocialStats[creatorId]` 的 usersFollowedByCount
- 正文：`value.content.bodyModel.paragraphs`（type 1=正文 3=标题 4=图）；付费文 body 同样返回，截断只发生在浏览器渲染面
- 不适用的面：search 页（403/坏 JSON）、`/_/api/users/<id>/profile/stream`（403）

## GraphQL

`POST https://medium.com/_/graphql` 免认证。`browse fetch` 是 GET 面，POST 走 pageEval 同源 fetch（先 goto 任意 medium 页）或门外 curl：

- `post(id:)` 可用字段：title / isLocked / clapCount / readingTime / wordCount / `topics {name slug}` / `creator {name username}`；`tags`/`author`/`recommends`/`content` 请求即 400
- `user(username:)` 可用：name / bio / `socialStats {followerCount followingCount}`；顶层 followerCount 400
- visibility 在 GraphQL 是字符串 `"PUBLIC"|"LOCKED"`（format=json 里是数字），锁态两边一致
- `collection()` 只收 id 不收 slug（id 从出版物页 `?format=json` 的 `payload.collection.id` 取）
- 文章 id = URL slug 尾部 12 位 hex（`-([a-f0-9]{12})$`），各 URL 形同 id

## RSS

```bash
browse fetch https://medium.com/feed/@karpathy    # 或 /feed/<publication>
```

- 最多 10 条最近文章；`content:encoded` 是全文 HTML；无 clap 数与付费状态；无翻页
- link 带 `?source=rss-...` 追踪参，剥 `?` 后即净 URL

## 翻页与坑

- profile / publication 的 `?format=json` 回 `payload.paging.next`（{limit, to, page}），拼回同 URL 即下一页
- `totalClapCount`（一人最多 50 拍累计）不等于 `recommends`（独立拍者数）；GraphQL 的 `clapCount` 等于前者
- 子域同文：`medium.com/@user/<slug>` 与 `user.medium.com/<slug>` 同 id 同数据，format=json 两边都行
- towardsdatascience.com 已迁自有 WordPress 非 Medium 面；Medium 侧归档在 `medium.com/towards-data-science`
- 无公开搜索 API：关键词检索要么浏览器要么拉 feed 本地滤
- 时间戳全是 unix 毫秒
