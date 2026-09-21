# 拖拽

场景：看板卡片排序、画布平移、滑块调节、文件拖放区。

- 指针/鼠标型（监听 mousedown/mousemove/mouseup 或 pointer 事件，游戏/地图/Figma 类画布）：`dragRef(srcRef, dstRef)` 一步到位（源中心按下分八步移到目标中心，覆盖追踪速度的站点）；坐标级手拼用 `mouseDown` 到 `mouseMove` 到 `mouseUp`（坐标缺省沿用最近落点）
- HTML5 DnD（监听 dragstart/drop 的 React DnD/Trello/Notion 类）：鼠标序列不触发 DragEvent（浏览器从原生 OS 拖拽合成，CDP 鼠标事件够不到），dragRef 覆盖不到这型：裸调 `Input.setInterceptDrags` 加 `Input.dispatchDragEvent`（dragEnter/dragOver/drop，data 取 `Input.dragIntercepted` 事件回执）
- 文件拖放区：底下多藏 input[type=file]，直接 `dropFiles(ref, paths)`（路径预检，不存在即报错）；无 input 的纯 dropzone 才 `pageEval` 合成 DataTransfer 的 drop 序列（会被反爬检测，能找到 input 就别走这条）
- 陷阱：drop 后等约 300ms 再截图（吸附/动画会把卡片挪到终位，过快落在旧坐标）；只监听 pointer 事件的站点 mouseDown 无响应时改发 pointer 序列
