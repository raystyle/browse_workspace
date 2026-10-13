# human-gate

需要人工确认时派发 `browse-human-arm`（`{message}`）：显示桌面通知，并在管理页提供「人工完成 → 放行」。用户选择菜单项或派发 `browse-human-done` 后，写入 `us-human-done` 并上报。`mech.rn` 等待页内 Promise 一次，不轮询。
