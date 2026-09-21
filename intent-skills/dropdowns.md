# 下拉框

场景：原生 select、自定义浮层菜单、可搜索 combobox、虚拟化长列表。

- 原生 select 用 `selectOption(ref, value)`（value 或可见 label；设值加派发 input/change；未命中报全部可选值）：不要点开选项，OS 菜单 CDP 关不掉
- 自定义浮层：`clickRef` 触发器后菜单晚到、常挂 body 下的 portal：重新 `findRefs`/`snapshot` 再按 role 或文本点选项（findRefs 盖顶层 AX 树，portal 也在其中）
- 可搜索 combobox（Downshift/Radix/MUI Autocomplete）多靠键盘提交：`fillRef`/`typeRef` 输入后 `pressKey("ArrowDown")` 加 `pressKey("Enter")`；MUI 的 blur 提交的是文本值非选中项，恒用 Enter；Radix 类要 Escape 才关得干净
- 虚拟化菜单（react-window/TanStack Virtual）只渲染可见项：`mouseWheel` 滚菜单容器到目标挂载再点
- 陷阱：菜单开合推移内容时，ref 动作坐标是动作时重解析的（天然免疫位移），但 ref 表本身是快照，菜单重开要重扫；选项 CSS pointer-events:none 时点击穿透，找内层 span 或上层选项容器
