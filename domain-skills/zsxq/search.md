# zsxq：全站搜索

`wx.zsxq.com` 知识星球全站搜索：搜用户已加入的全部星球（主题、文件、用户）。依赖登录态（引擎 profile 持久会话）；未登录时直链只回营销壳。

## 通道与范围

- 直链搜索：`https://wx.zsxq.com/search/<URL编码词>`；SPA 路由生效，无需 UI 输入
- 范围开关：从群内发起的搜索带 `?groupId=<id>` 限当前星球；直链不带 groupId 默认全站。结果页顶部有「当前星球 / 全部星球」开关，点「全部星球」后 URL 去掉 groupId
- 参数 `?keyword=` 形态无效（回薄壳），别用

```
await goto("https://wx.zsxq.com/search/<urlenc>", {waitIdle: true})
await session.waitJs("document.body && document.body.innerText.includes('搜索结果')", 10)
```

## 结果抽取

结果项是 `.topic-container`（Angular 组件，类名含 disabled-copy），innerText 自带标题、日期与来源星球：

```
return await pageEval(`(() => {
  const items = [...document.querySelectorAll('.topic-container')].map(e => ({
    text: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 150),
    href: e.closest('a') ? e.closest('a').href : null
  }))
  return JSON.stringify(items)
})()`)
```

## 结果页结构

- 类型页签：全部 / 主题 / 文件 / 用户（文件页签可搜星球内共享文件）
- 排序：综合 / 最新；另有筛选
- 翻页是滚动加载（无限滚动，见 page-skills/lazy-scroll）

## 边界与坑

- 登录态判别：goto 群页后 body 出现「笔记 | 星球管理后台 | 榜单」导航即已登录；搜索页 body 过薄（<200 字符）多为掉登录
- 直链搜索词要 URL 编码，中文与空格都编码
- 付费星球内容搜索结果可见摘要，正文打开需圈权限（用户已加入的不受限）
- 2026-09-23 实测：全站搜「fastjson 反序列化」命中 2025-03 MachineKeys 爆破 ViewState 等实战帖，结果项类名稳定
