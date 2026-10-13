# challenge-stop

识别挑战页并停止编排。`@detect` 在存在 turnstile、挑战 DOM 或 captcha 脚本时返回 CONFIRMED。运行时若发现挑战节点，则 `POST /userscript/stop`。页面随后出现的挑战同样停止。
