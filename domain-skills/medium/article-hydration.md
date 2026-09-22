# medium：正文抽取（浏览器通道，DOM 兜底）

只在 API 面被墙（Cloudflare 挑战词）、会员文（API 标 locked 但登录浏览器可渲染全文）、JS 付费墙弹层时走浏览器；免费文能用 API 就用 scraping.md。

## 结构（按标签选，别信 CSS 类）

- 正文在页面唯一 `<article>` 内；块级 h1-h4 / p / pre / blockquote / ul / ol / figure
- 图恒 `<figure>` 包 `<img>` 加 `<figcaption>` 兄弟；真分辨率在 `miro.medium.com/v2/resize:fit:<N>/`
- 代码块 `<pre>` 不带语言 class，出纯围栏；引用块是嵌 `<p>` 的 `<blockquote>`
- Medium 的 class 名是哈希轮换（pw-post-body-paragraph 等）：选择器恒用标签

## 时序

readyState=complete 不够：作者卡与 clap 挂件在其后继续水合，骨架期 `<article>` 外框在而首几段还是骨架 div。形态：`goto(url, {waitIdle: true})` 加 `waitJs("document.querySelector('article p') && document.querySelector('article p').innerText.length > 100", 10)` 等首段落实。`<article>` 在而全文 <500 字符 = 付费墙截了：查登录态与付费状态后按 scraping.md API 面核对。

## 抽取器（pageEval 一次求值）

```js
pageEval(`(()=>{
  const article = document.querySelector('article');
  if (!article) return null;
  const blocks = article.querySelectorAll('h1,h2,h3,h4,p,pre,blockquote,ul,ol,figure');
  const out = []; const seen = new Set();
  for (const el of blocks) {
    let skip = false;
    for (const s of seen) { if (s.contains(el) && s !== el) { skip = true; break; } }
    if (skip) continue;
    seen.add(el);
    const tag = el.tagName, txt = (el.innerText || '').trim();
    if (!txt && tag !== 'FIGURE') continue;
    if (tag === 'H1') out.push('# ' + txt);
    else if (tag === 'H2') out.push('## ' + txt);
    else if (tag === 'H3') out.push('### ' + txt);
    else if (tag === 'H4') out.push('#### ' + txt);
    else if (tag === 'PRE') out.push('\`\`\`\n' + txt + '\n\`\`\`');
    else if (tag === 'BLOCKQUOTE') out.push(txt.split('\n').map(l => '> ' + l).join('\n'));
    else if (tag === 'UL' || tag === 'OL') {
      out.push([...el.querySelectorAll(':scope > li')].map((li, i) =>
        (tag === 'OL' ? (i + 1) + '. ' : '- ') + li.innerText.trim()).join('\n'));
    } else if (tag === 'FIGURE') {
      const img = el.querySelector('img'), cap = el.querySelector('figcaption');
      if (img && img.src) out.push('![' + (img.alt || (cap ? cap.innerText.trim() : '')) + '](' + img.src + ')');
    } else if (tag === 'P') out.push(txt);
  }
  return out.join('\n\n');
})()`)
```

顶部按钮行渣块（「6 2 Listen Share More」一类）不在标题块里混进 p 的：对产出按空行分块，把开头 <12 字符的块逐块丢弃到首个真块（H1 或长段）。

## 边界

- 别用 `article.innerText` 整取：代码块丢围栏、列表丢标记、图整张消失
- figure 的 alt 与 figcaption 常重复：优先 alt，避免双发
- 文末 About 卡时有时无：存档场景无妨；只要正文按已知页脚串（Follow / More from / Written by）截
- 付费墙检测：pageEval 看 `[data-testid*="paywall"]` 或 `[aria-label*="Sign in" i]` 任一在即墙
