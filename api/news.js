// Live news digest. Runs on request and is cached at the Vercel edge, so it
// does not depend on any scheduler. Falls back to the committed news.json in the page.
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; sg-news/1.0)' };
const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&');
const strip = s => unesc(s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

async function get(u) {
  const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('http ' + r.status);
  return r.text();
}
function tag(it, name) { const m = it.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>')); return m ? m[1] : ''; }

async function gn(path, q) {
  const base = 'hl=en-IN&gl=IN&ceid=IN:en';
  const u = q ? 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:1d') + '&' + base
              : 'https://news.google.com/rss/' + path + (path.includes('?') ? '&' : '?') + base;
  const x = await get(u), out = [];
  for (const it of x.match(/<item>[\s\S]*?<\/item>/g) || []) {
    const l = strip(tag(it, 'link'));
    let t = strip(tag(it, 'title'));
    if (!t || !l) continue;
    const s = strip(tag(it, 'source'));
    if (s && t.endsWith(' - ' + s)) t = t.slice(0, -(s.length + 3));
    let d = ''; const pd = new Date(strip(tag(it, 'pubDate')));
    if (!isNaN(pd)) d = pd.toISOString().replace(/\.\d+Z$/, 'Z');
    out.push({ t, u: l, s, d });
    if (out.length === 5) break;
  }
  return out;
}
async function trends() {
  const x = await get('https://trends.google.com/trending/rss?geo=IN'), out = [];
  for (const it of x.match(/<item>[\s\S]*?<\/item>/g) || []) {
    const q = strip(tag(it, 'title')); if (!q) continue;
    const n = strip(tag(it, 'ht:approx_traffic'));
    out.push({ t: q, u: 'https://www.google.com/search?q=' + encodeURIComponent(q), s: n ? 'Searches: ' + n : 'Google Trends India', d: '' });
    if (out.length === 5) break;
  }
  return out;
}
async function gh() {
  const h = await get('https://github.com/trending?since=daily'), out = [];
  for (const a of h.match(/<article class="Box-row">[\s\S]*?<\/article>/g) || []) {
    const m = a.match(/<h2[^>]*>[\s\S]*?href="\/([^"]+)"/); if (!m) continue;
    const repo = m[1].trim();
    const d = a.match(/<p class="col-9[^>]*>([\s\S]*?)<\/p>/), st = a.match(/([\d,]+) stars today/);
    out.push({ t: repo, u: 'https://github.com/' + repo, s: st ? st[1] + ' stars today' : 'GitHub Trending', x: d ? strip(d[1]).slice(0, 140) : '', d: '' });
    if (out.length === 5) break;
  }
  return out;
}
const CATS = {
  india: () => gn('headlines/section/geo/India'),
  world: () => gn('headlines/section/topic/WORLD'),
  tech: () => gn('headlines/section/topic/TECHNOLOGY'),
  sports: () => gn('headlines/section/topic/SPORTS'),
  movies: () => gn(null, 'movies OR bollywood OR box office'),
  ai: () => gn(null, 'artificial intelligence'),
  trending: trends,
  github: gh
};

module.exports = async (req, res) => {
  const keys = Object.keys(CATS);
  const got = await Promise.all(keys.map(k => CATS[k]().catch(() => [])));
  const c = {}; let live = 0;
  keys.forEach((k, i) => { if (got[i].length) { c[k] = got[i]; live++; } });
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!live) { res.setHeader('Cache-Control', 'no-store'); res.statusCode = 502; return res.end('{"error":"upstream"}'); }
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=21600');
  res.end(JSON.stringify({ updated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), live: true, c }));
};
