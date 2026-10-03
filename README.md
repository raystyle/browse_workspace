# browse_workspace：browse 的站点与机制知识仓

单仓维护 browse CLI 的触发式 skill 资产：domain-skills（域名触发，站点知识）与 page-skills（页面特征触发，含 scripts/ 特征判据 rn 脚本）。部署到三平台用户目录（Windows `%USERPROFILE%\.browse-rs\workspace`；Linux/macOS `~/.browse-rs/workspace`），git 维护：install 是 clone，update 是 pull，本地修改可 commit 后 push 回推本仓。

browse 0.21.0 起本仓是多根加载的缺省根：`browse workspace add <路径>` 登记同构自定义仓（序首命中整胜，未覆盖段本仓仍生效）。

## 三级发现面（agent 怎么用）

1. **goto 自动点名**：`goto(url)` 回执命中时附 `domain_skills`（该站文件清单，封顶 10）与 `page_skills`（页面特征 slug 列表，带 CONFIRMED/PLAUSIBLE 置信档）及各自 hint 字段
2. **hint 读全文**：`browse workspace site <段>` 读单站全文；`browse workspace page <slug>` 读单篇机制配方（免浏览器，CLI 直读文件）

点名不附正文：知识按需拉取，不占上下文。两层触发可独立关闭：`BROWSE_DOMAIN_SKILLS=0` / `BROWSE_PAGE_SKILLS=0`。

## 目录约定

| 目录 | 内容 | 触发方式 |
| --- | --- | --- |
| `domain-skills/<段>/<主题>.md` | 一站一目录，一文件一主题（选择器、结构、坑） | goto 按 URL 域名段点名 |
| `page-skills/<slug>.md` | 一文件一机制配方（10 slug 首发，清单见该目录 README） | goto 按页面特征点名 |
| `page-skills/scripts/probe.rn` | 页面特征判据脚本（browse 隐式加载，goto/detect 触发） | 多根序首命中覆写内置缺省；主世界 cdp::js 求值、browse 侧 8 秒界、超时/坏脚本静默降级零键；rn 脚本**不走 Jinja 模板道**（无 --vars，`{{ }}` 是字面） |

前两目录即自定义仓契约：`browse workspace add` 登记的仓只需同构
`domain-skills/<段>/` 与 `page-skills/<slug>.md`，goto/fetch 点名与
site/page/list 读全文即吃多根序（配置固化 `~/.browse-rs/workspaces.json`，
`BROWSE_WORKSPACE` env 钉死时单根最高、多根配置不生效）。
是本仓扩充面，agent 侧 rg 反查，不进 browse 加载面，自定义仓不必有。

## 部署

```bash
browse workspace install    # git clone 本仓到 ~/.browse-rs/workspace（BROWSE_WORKSPACE 可覆盖路径）
browse workspace update     # git pull --ff-only；本地有未提交修改会拒绝
browse workspace status     # 安装态、git 态、技能计数
browse workspace list       # 列全部段与 slug
browse workspace add ~/my-skills     # 登记自定义仓（同构两目录即吃点名；多根序首优先）
browse workspace remove ~/my-skills  # 移除登记（本仓缺省根不受影响）
```

没有 browse 时手工等价：`git clone https://github.com/raystyle/browse_workspace.git ~/.browse-rs/workspace`。

路径刻意不分 BROWSE_NAME 命名空间：站点知识是跨实例共享资产（与 daemon 端口、引擎 profile 的按名隔离相反）。

## 回推口径

本地加知识、修错字都欢迎回推：仓内改文件，`git -C ~/.browse-rs/workspace add -A && git commit -m "..." && git push`。`browse workspace update` 会拒绝覆盖未提交修改，先 commit 或 stash。不想回推公开仓的知识可放自管仓（fork 或私有 git 仓同构两目录），`browse workspace add <路径>` 登记即用。

## 与 browse 的版本关系

本仓是知识面，不锁 browse 版本；配方引用的命令面以 `browse --llms` 为准。browse 0.21.0 起面加多根自定义仓（`workspace add`/`remove`，#63）：本仓保持种子与缺省垫底根，自定义仓同构即插即用。
