# intent-skills：意图索引配方

无页面特征的通用配方：goto 触发层点名不到（没有可检测信号），按意图反查。检索口径：

```bash
rg -il "上传|下载|对话框" ~/.browse-rs/workspace/intent-skills/
```

## 在册（17 篇全迁，2026-09-21 收口）

| 文件 | 何时读 |
| --- | --- |
| navigation-race.md | navigate 后取内容/截图/等事件的竞速与等待判官选择 |
| file-download.md | 文件上传与下载的通道与信号（uploads/downloads 两源并入） |
| mouse-input.md | 鼠标/输入原语的语义坑（滚轮首发、后台 tab、role 挑选） |
| dialogs.md | JS 对话框三件（dialogStatus/dialogAccept/dialogDismiss）与打桩 |
| dropdowns.md | 下拉框 select 与自定义组件两型（selectOption/combobox 键盘提交） |
| drag-and-drop.md | 拖拽三型（dragRef 指针型、HTML5 DnD 裸调道、文件拖放区） |
| tabs.md | 多 tab 纪律（newTab/switchTab/closeTab 守卫、可见序陷阱） |
| element-refs.md | 元素引用表语义（snapshot/findRefs 的生成、失效与省 token 两段式） |
| network-requests.md | 网络观测族（requests/requestDetail/responseBody/waitForResponse/拦截三件） |
| screenshots.md | 截图面（format/ifChanged/ref 元素级、annotate/highlight 取证） |
| print-as-pdf.md | 页面存 PDF（pdf() 与 Page.printToPDF 全参、window.print 打桩） |
| viewport.md | 视口与 UA 仿真（emulate/emulateMedia、DPR 换算、断点时机） |
| cookies.md | cookie 与存储族（读写删、storageState 往返、cloneCookies 热迁） |
| connection.md | 连接与附着（session.connect/use、附着优先策略、人机共存） |

前代 bh interaction-skills 17 篇迁移完毕（4 篇页面特征类分流进 page-skills，3 篇直迁，10 篇本批新写）；本地 bh 安装已整体退役清理，源头唯一在册 GitHub raystyle/browser-harness@5994413，回溯考据再克隆。

## 写作规约

- 一文件一机制；先「什么时候读我」一句，再配方与陷阱
- 引用 browse 命令面以 `browse --llms` 为准，不复制长帮助文
