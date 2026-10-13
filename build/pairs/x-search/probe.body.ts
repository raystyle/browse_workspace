// x.com 实时搜索探针。只写 probe 属性,不发帖、不点赞。
// 选择器写在函数里。tweetText 缺席时退回 article 文本。

const CAP = 20;

function queryOf(): string {
  try {
    return new URL(location.href).searchParams.get('q') || '';
  } catch {
    return '';
  }
}

function isLogin(): boolean {
  const path = location.pathname || '';
  return path.indexOf('/i/jf/') === 0 || path.indexOf('/i/flow/login') === 0 || path.indexOf('/login') === 0;
}

function collectPosts(): Array<{ id: string; href: string; user: string; text: string; time: string }> {
  const posts: Array<{ id: string; href: string; user: string; text: string; time: string }> = [];
  const seen: Record<string, 1> = {};
  const arts = document.querySelectorAll('article');
  for (let i = 0; i < arts.length && posts.length < CAP; i++) {
    const a = arts[i];
    let id = '';
    let href = '';
    const statusLinks = a.querySelectorAll('a[href*="/status/"]');
    for (let j = 0; j < statusLinks.length; j++) {
      const h = (statusLinks[j].getAttribute('href') || '').split('?')[0];
      const m = h.match(/\/status\/(\d+)$/);
      if (m) {
        id = m[1];
        href = h;
        break;
      }
    }
    if (!id || seen[id]) continue;
    seen[id] = 1;
    let user = '';
    const anchors = a.querySelectorAll('a[href]');
    for (let j = 0; j < anchors.length; j++) {
      const h = (anchors[j].getAttribute('href') || '').split('?')[0];
      if (/^\/[A-Za-z0-9_]{1,15}$/.test(h)) {
        user = h.slice(1);
        break;
      }
    }
    const timeEl = a.querySelector('time');
    const time = timeEl ? timeEl.getAttribute('datetime') || '' : '';
    const tt = a.querySelector('[data-testid="tweetText"]');
    const raw = tt ? tt.textContent || '' : a.textContent || '';
    const text = raw.replace(/\s+/g, ' ').trim().slice(0, 400);
    posts.push({ id, href, user, text, time });
  }
  return posts;
}

function publish(): void {
  const login = isLogin();
  const posts = login ? [] : collectPosts();
  const onSearch = (location.pathname || '').indexOf('/search') === 0;
  let verdict = 'idle';
  if (login) verdict = 'login';
  else if (posts.length) verdict = 'ok';
  else if (onSearch) verdict = 'empty';
  const settled = login || posts.length > 0;
  const payload = {
    slug: 'x-search',
    verdict,
    settled,
    href: location.href,
    q: queryOf(),
    posts,
    at: Date.now(),
  };
  document.documentElement.setAttribute('probe', JSON.stringify(payload));
}

let timer = 0;
function schedule(): void {
  if (timer) return;
  timer = window.setTimeout(() => {
    timer = 0;
    publish();
  }, 150);
}

publish();
const root = document.body || document.documentElement;
const mo = new MutationObserver(schedule);
mo.observe(root, { childList: true, subtree: true });
