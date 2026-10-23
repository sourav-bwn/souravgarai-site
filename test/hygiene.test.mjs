// Repository hygiene checks for the static site: no broken pages, images or
// data files. Runs fully offline against the working tree.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html'));

test('every sitemap URL points at a page that exists', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.ok(locs.length >= 25, 'sitemap should list the site pages');
  for (const loc of locs) {
    const file = loc.replace(/^https:\/\/[^/]+\//, '') || 'index.html';
    assert.ok(fs.existsSync(path.join(root, file)), `sitemap entry missing on disk: ${loc}`);
  }
});

test('every local href and src in the pages resolves to a file', () => {
  const skip = /^(https?:|mailto:|tel:|data:|\/\/|#|\/_vercel\/)/;
  for (const page of htmlFiles) {
    const refs = [...read(page).matchAll(/(?:href|src)="([^"#]+)"/g)].map(m => m[1]);
    for (const ref of refs) {
      if (skip.test(ref)) continue;
      const file = ref.split('?')[0];
      assert.ok(fs.existsSync(path.join(root, file)), `${page} references missing ${ref}`);
    }
  }
});

function readWindowArray(file, key) {
  const src = read(file);
  const start = src.indexOf('window.' + key + '=');
  assert.ok(start >= 0, `${file} should define window.${key}`);
  return JSON.parse(src.slice(start + ('window.' + key + '=').length).trim().replace(/;$/, ''));
}

test('news.json matches the shape the digest page renders', () => {
  const news = JSON.parse(read('news.json'));
  assert.equal(typeof news.updated, 'string');
  for (const [cat, items] of Object.entries(news.c)) {
    assert.ok(Array.isArray(items) && items.length <= 5, `${cat} list`);
    for (const it of items) {
      assert.ok(it.t && it.u, `${cat} item needs a title and link`);
      assert.match(it.u, /^https:\/\//, `${cat} links stay on https`);
    }
  }
});

test('data.js GitHub payload has days, totals and repos', () => {
  const sg = readWindowArray('data.js', 'SG');
  assert.ok(Array.isArray(sg.days) && sg.days.length > 300, 'contribution days');
  for (const d of sg.days) {
    assert.equal(d.length, 3);
    assert.match(d[0], /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.equal(sg.total, sg.days.reduce((a, d) => a + d[2], 0), 'total matches day counts');
  assert.ok(sg.repos.length > 0 && sg.publicRepos > 0);
  for (const r of sg.repos) assert.ok(r.name && r.url, 'repo entry needs name and url');
});

test('kb.js chatbot answers keep the documented shape', () => {
  const kb = readWindowArray('kb.js', 'KB');
  assert.ok(kb.length >= 20, 'knowledge base entries');
  for (const e of kb) {
    assert.ok(e.k && e.a, 'entry needs keywords and an answer');
    if (e.l) assert.ok(fs.existsSync(path.join(root, e.l[1])), `kb link ${e.l[1]}`);
  }
});

test('homepage certificate count fallback matches the real record count', () => {
  // index.html shows "All <span data-certs-count>N</span> certificates". JS
  // overwrites N live, but the static fallback must still be right for no-JS
  // visitors and crawlers - it drifted once already (29 vs 35 records).
  const win = {}; new Function('window', read('certs.js'))(win);
  const html = read('index.html');
  const m = html.match(/<span data-certs-count>(\d+)<\/span>/);
  assert.ok(m, 'index.html keeps a data-certs-count span for the count');
  assert.equal(Number(m[1]), win.CERTS.length,
    'fallback count in index.html must equal certs.js record count');
});

test('certs.js entries follow the documented schema with existing files', () => {
  const win = {}; new Function('window', read('certs.js'))(win);
  const certs = win.CERTS;
  assert.ok(certs.length >= 20, 'certificate entries');
  const keys = new Set(['cisco', 'mongo', 'myb']);
  for (const c of certs) {
    for (const field of ['n', 'i', 'k', 'd', 'x'])
      assert.ok(c[field], `${c.n || '?'} missing ${field}`);
    assert.ok(keys.has(c.k), `${c.n} issuer key ${c.k} matches a filter tab`);
    for (const field of ['img', 'f'])
      // Hosted URLs (e.g. Credly badge images) need no local file; only
      // site-local proof files must exist in the repo.
      if (c[field] && !/^https?:\/\//.test(c[field]))
        assert.ok(fs.existsSync(path.join(root, c[field])), `${c.n} missing ${c[field]}`);
  }
});
