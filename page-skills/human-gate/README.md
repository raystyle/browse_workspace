# human-gate

编排需要人裁时 dispatch `browse-human-arm` `{message}`:桌面通知 + 管理页菜单「人工完成 → 放行」。人点菜单或 dispatch `browse-human-done` 后写 `us-human-done` 并上报。mech 一次 await 页内 Promise,不轮询。
