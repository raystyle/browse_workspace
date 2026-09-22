# domain-skills：站点知识

一站一目录、一文件一主题。目录名（段）是 goto 触发层的匹配键。

## 命名规约

段 = 目标 URL 的 hostname 去掉 `www.` 前缀后的首个 `.` 前段：

| 站点 hostname | 段（目录名） |
| --- | --- |
| github.com | github |
| www.x.com | x |
| news.ycombinator.com | news |
| mail.google.com | mail |

多词域名用首段名建目录（bbc.co.uk 的段是 bbc）。子域不同即不同段：mail.google.com 与 docs.google.com 是两个段，各自建目录。

## 触发机制

`goto(url)` 成功后 browse 取段名查 `domain-skills/<段>/`，命中则回执附 `domain_skills`（文件名列表，封顶 10，超出的不点名）与 `domain_skills_hint`（读全文命令）。agent 看到 hint 后按需 `browse workspace site <段>` 拉全文。

## 写作建议

- 首行 `# <站名>：<主题>`，正文先给「先查 API 再上浏览器」类的最短路径
- 选择器、URL 结构、翻页规律、反爬边界写已验证值；过期即改，别留猜
- 站点知识只写该站特有内容；通用机制（shadow DOM、验证码）归 page-skills
