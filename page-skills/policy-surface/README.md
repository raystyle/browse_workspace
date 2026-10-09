# policy-surface

策略与敏感面侦察对(安全类)。@detect 看 CSP meta/可见密码框出
PLAUSIBLE;mech 拼页内摘要(CSP meta/密码框数/storage 键名类别计数,
**值不读不上报**)与 CDP 侧响应头(CSP/server,经 cdp::raw 的 Network 面)。
侦察报告不是停条件;DOM XSS 注入探针故意不设(边界裁定在 X 检索轮)。
无常驻腿。
