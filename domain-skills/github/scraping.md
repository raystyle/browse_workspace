# github：公开数据抓取

`https://github.com`，公开数据混 REST API（快、限速）与浏览器面（trending 页无 API 等价）。

## 先走 API（不要先开浏览器）

仓库/用户/release 元数据走 REST API，一次调用零浏览器成本：

```bash
browse fetch https://api.github.com/repos/browser-use/browser-use
# 关键字段：stargazers_count、forks_count、description、language、topics、
# open_issues_count、created_at、updated_at、pushed_at、default_branch、license、visibility
```

文件内容走 raw.githubusercontent.com（无限速、免认证、免 base64 解码）：

```bash
browse fetch https://raw.githubusercontent.com/owner/repo/main/README.md
browse fetch https://raw.githubusercontent.com/owner/repo/main/Cargo.toml
```

浏览器只用于 trending 页（服务端渲染 HTML，无 API 等价）：

```
return await goto("https://github.com/trending", {waitIdle: true})
```

## 常用工作流

- 仓库元数据：`browse fetch https://api.github.com/repos/<owner>/<repo>`（字段面见上）
- 用户/组织档案：`browse fetch https://api.github.com/users/<login>`（public_repos、followers、created_at）
- release 清单：`browse fetch https://api.github.com/repos/<owner>/<repo>/releases?per_page=100`
- 搜索：`browse fetch "https://api.github.com/search/repositories?q=<kw>&sort=stars"`（search 面 10 次/分钟限速，比核心面紧）
- trending 页：goto 后 `findRefs("仓库名")` 拿 ref 再取结构，或 pageEval 抓 BoxRow 清单

## 限速与认证

- 未认证 60 次/时/源 IP；带 token 5000 次/时。token 放环境变量别写进片段：
  认证头经引擎腿不方便时用 `routeMock` 之外的正道（fetch 面暂无 header 通道，认证抓取走
  pageEval 的 fetch 或 curl 等门外工具）
- 触到限速回 403 带 `X-RateLimit-Remaining: 0`：等窗口重置（看 `X-RateLimit-Reset`），别重试风暴

## 浏览器腿的坑（trending / 登录态面）

- trending 每日缓存变动：同日多次 goto 结果一致属正常，不是你的选择器错了
- 未登录 trending 可见；登录后页面结构略有差异，snapshot 后按 role/name 挑，别写死 CSS 选择器
- github.com 是 React 面（回执常见 framework: react）：DOM 结构随版本变，优先 AX 树（findRefs/snapshot）而非 querySelector
- 企业页（github.com/enterprises）与 gist 面结构不同，别套本页配方

## 边界

- 私有仓数据不在本配方范围（要认证与权限，走各自工具链）
- API 结构化数据永远优先于页面解析；页面只是没有 API 时的兜底
