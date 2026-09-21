# browse_workspace：browse 的站点与机制知识仓

单仓维护 browse CLI 的 skill 资产：domain-skills（站点知识）、page-skills（页面特征机制配方）、intent-skills（意图索引配方）。部署到三平台用户目录（Windows `%USERPROFILE%\.browse-rs\workspace`；Linux/macOS `~/.browse-rs/workspace`），git 维护：install 是 clone，update 是 pull，本地修改可 commit 后 push 回推本仓。

## 三级发现面（agent 怎么用）

1. **goto 自动点名**：`goto(url)` 回执命中时附 `domain_skills`（该站文件清单，封顶 10）与 `page_skills`（页面特征 slug 列表，带 CONFIRMED/PLAUSIBLE 置信档）及各自 hint 字段
2. **hint 读全文**：`browse workspace site <段>` 读单站全文；`browse workspace page <slug>` 读单篇机制配方（免浏览器，CLI 直读文件）
3. **意图反查**：无页面特征的配方（上传下载、对话框、下拉等）走 intent-skills/ 索引，`rg -il "关键词" intent-skills/` 反查

点名不附正文：知识按需拉取，不占上下文。两层触发可独立关闭：`BROWSE_DOMAIN_SKILLS=0` / `BROWSE_PAGE_SKILLS=0`。

## 目录约定

| 目录 | 内容 | 触发方式 |
| --- | --- | --- |
| `domain-skills/<段>/<主题>.md` | 一站一目录，一文件一主题（选择器、结构、坑） | goto 按 URL 域名段点名 |
| `page-skills/<slug>.md` | 一文件一机制配方（10 slug 首发，清单见该目录 README） | goto 按页面特征点名 |
| `intent-skills/<机制>.md` | 无页面特征的通用配方与索引 | 意图反查，不自动触发 |

## 部署

```bash
browse workspace install    # git clone 本仓到 ~/.browse-rs/workspace（BROWSE_WORKSPACE 可覆盖路径）
browse workspace update     # git pull --ff-only；本地有未提交修改会拒绝
browse workspace status     # 安装态、git 态、技能计数
browse workspace list       # 列全部段与 slug
```

没有 browse 时手工等价：`git clone https://github.com/raystyle/browse_workspace.git ~/.browse-rs/workspace`。

路径刻意不分 BROWSE_NAME 命名空间：站点知识是跨实例共享资产（与 daemon 端口、引擎 profile 的按名隔离相反）。

## 回推口径

本地加知识、修错字都欢迎回推：仓内改文件，`git -C ~/.browse-rs/workspace add -A && git commit -m "..." && git push`。`browse workspace update` 会拒绝覆盖未提交修改，先 commit 或 stash。

## 与 browse 的版本关系

本仓是知识面，不锁 browse 版本；配方引用的命令面以 `browse --llms` 为准。资产种子源自前代 browser-harness（94 站 domain-skills 与 17 篇 interaction-skills）：interaction 17 篇已全迁（2026-09-21 收口），94 站 domain-skills 精选迁移仍开放；前代本地安装已退役清理，源头唯一在册 GitHub raystyle/browser-harness@5994413。
