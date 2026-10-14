// 元素身份。选择器漂了以后，用这条路径再找回同一个节点。
// 有唯一 id 时停在 #id / //*[@id=...]；否则按 nth-child 与同名序号往上走到 body。

function cssEscape(ident: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(ident);
  return ident.replace(/[^a-zA-Z0-9_-]/g, (ch) => '\\' + ch);
}

export function cssPath(node: Element): string {
  if (!node || node.nodeType !== 1) return '';
  const doc = node.ownerDocument;
  const uniqueId = (el: Element): string => {
    if (!el.id || !doc) return '';
    const sel = '#' + cssEscape(el.id);
    try {
      if (doc.querySelectorAll(sel).length === 1) return sel;
    } catch {
      return '';
    }
    return '';
  };
  const hit = uniqueId(node);
  if (hit) return hit;
  const parts: string[] = [];
  let cur: Element | null = node;
  while (cur && cur.nodeType === 1) {
    const idSel = uniqueId(cur);
    if (idSel) {
      parts.unshift(idSel);
      break;
    }
    const parent = cur.parentElement;
    if (!parent) {
      parts.unshift(cur.tagName.toLowerCase());
      break;
    }
    let idx = 1;
    let sib = parent.firstElementChild;
    while (sib && sib !== cur) {
      idx += 1;
      sib = sib.nextElementSibling;
    }
    parts.unshift(cur.tagName.toLowerCase() + ':nth-child(' + idx + ')');
    if (cur === doc.body) break;
    cur = parent;
  }
  return parts.join(' > ');
}

export function xpath(node: Element): string {
  if (!node || node.nodeType !== 1) return '';
  if (node.id) return '//*[@id="' + node.id.replace(/"/g, '') + '"]';
  const parts: string[] = [];
  let cur: Element | null = node;
  const doc = node.ownerDocument;
  while (cur && cur.nodeType === 1) {
    const parent = cur.parentElement;
    const name = cur.tagName.toLowerCase();
    if (!parent) {
      parts.unshift(name);
      break;
    }
    let same = 0;
    let idx = 0;
    let sib = parent.firstElementChild;
    while (sib) {
      if (sib.tagName === cur.tagName) {
        same += 1;
        if (sib === cur) idx = same;
      }
      sib = sib.nextElementSibling;
    }
    parts.unshift(same > 1 ? name + '[' + idx + ']' : name);
    if (doc && cur === doc.body) break;
    cur = parent;
  }
  return '//' + parts.join('/');
}
