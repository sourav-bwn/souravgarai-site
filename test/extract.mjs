// Test helper: pulls pure functions out of the shipped browser scripts so the
// exact code visitors run is exercised in Node, without a DOM and without
// keeping a second copy that could drift from the site.
import fs from 'node:fs';

export function extractFn(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('function not found: ' + name);
  let i = src.indexOf('{', start), depth = 0, end = -1;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (!depth) { end = i + 1; break; } }
  }
  if (end < 0) throw new Error('unbalanced braces in: ' + name);
  return src.slice(start, end);
}

export function loadEveryday(path = new URL('../everyday.js', import.meta.url)) {
  const src = fs.readFileSync(path, 'utf8');
  const names = ['loan', 'incomeTax', 'indianWords', 'dayUTC', 'upiURI', 'textLine'];
  const body = names.map(n => extractFn(src, n)).join('\n');
  return new Function(body + `\nreturn {${names.join(',')}};`)();
}

export function loadNewsHelpers(path = new URL('../api/news.js', import.meta.url)) {
  const src = fs.readFileSync(path, 'utf8');
  const start = src.indexOf('const unesc');
  const end = src.indexOf('async function get');
  if (start < 0 || end < 0) throw new Error('news helpers not found');
  const body = src.slice(start, end) + '\n' + extractFn(src, 'tag');
  return new Function(body + '\nreturn {unesc, strip, tag};')();
}
