# scripts/vendor/

钉版第三方发行件的家。钉版纪律与仓内一致:exact 版本、sha256 边车、LICENSE 注记,升级 = 换件加边车加 LICENSE 三件同批。

## mdream.iife.js(钉 2.0.1 exact)

- **来源**:npm `mdream@2.0.1` 官方 `dist/iife.js` 发行形(单文件,WASM 以 base64 内嵌,无外置资源、无网络拉取;MIT,见 LICENSE-mdream.txt)
- **暴露**:`window.mdream.htmlToMarkdown(html, {minimal, origin, clean, ...})`(使用者所在 JS 世界;同步返串)
- **消费方**:`page-skills/google-search/probe.user.js` 字节等内嵌(油猴世界执行,不吃页面 CSP,用户裁定 con-06-add1;弃 esbuild/@mdream/js ESM 转译线)
- **守卫**:`tests/check.ts` 校内嵌副本与本件字节等 + sha256 边车对账;漂移即红
- **选形记**:官方 IIFE 带 WASM 是为 cdp::js 主世界注入被 google.com CSP 拦而绕行的形(con-06 原案);油猴道确立后保留 IIFE 形因其自包含单文件最耐装(内联零安装期网络依赖)
