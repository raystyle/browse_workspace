# intent-skills：意图索引配方

无页面特征的通用配方：goto 触发层点名不到（没有可检测信号），按意图反查。检索口径：

```bash
rg -il "上传|下载|对话框" ~/.browse-rs/workspace/intent-skills/
```

## 在册（已迁）

| 文件 | 何时读 |
| --- | --- |
| navigation-race.md | navigate 后取内容/截图/等事件的竞速与等待判官选择 |
| file-download.md | 文件上传与下载触发的通道与信号 |
| mouse-input.md | 鼠标/输入原语的语义坑（滚轮首发、后台 tab、role 挑选） |

## 待迁名单（前代 bh interaction-skills 17 篇中无页面特征子集，正文后续批）

| 机制 | 一句话 |
| --- | --- |
| uploads | 文件上传的 input 与拖拽两路（browse 面见 file-download.md 上传节） |
| downloads | 下载信号与落盘（与 file-download.md 合并候选） |
| dialogs | JS 对话框三件（dialogStatus/dialogAccept/dialogDismiss） |
| dropdowns | 下拉框 select 与自定义组件两型（selectOption） |
| drag-and-drop | 拖拽序列（mouseDown-Move-Up 手拼与 dragRef） |
| tabs | 多 tab 纪律（listPageTargets/switchTab/closeTab 守卫） |
| element-refs | 元素引用表语义（snapshot ref 的生成与失效） |
| network-requests | 网络观测族（requests/requestDetail/responseBody/waitForResponse） |
| screenshots | 截图面（screenshot opts 与 ifChanged） |
| print-as-pdf | 页面存 PDF（pdf()，仅无头） |
| viewport | 视口与 UA 仿真（emulate/emulateMedia） |
| cookies | cookie 与存储族（cookies/cookieGet/localGet/storageState 往返） |
| connection | 连接与附着（session.connect/use、附着优先策略） |

## 写作规约

- 一文件一机制；先「什么时候读我」一句，再配方与陷阱
- 引用 browse 命令面以 `browse --llms` 为准，不复制长帮助文
