import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEveryday, loadNewsHelpers } from './extract.mjs';

const { loan, incomeTax, indianWords, dayUTC, upiURI, textLine } = loadEveryday();

test('loan matches the standard EMI formula', () => {
  const l = loan(100000, 12, 12);
  assert.ok(Math.abs(l.payment - 8884.8788) < 0.01, `payment ${l.payment}`);
  assert.equal(l.rows.length, 12);
  assert.ok(l.rows.at(-1).balance < 1e-6);
  const paid = l.rows.reduce((a, r) => a + r.paid, 0);
  assert.ok(Math.abs(paid - l.total) < 0.01);
  assert.ok(Math.abs(l.total - (100000 + l.interest)) < 1e-9);
});

test('loan handles a zero interest rate', () => {
  const l = loan(12000, 0, 12);
  assert.equal(l.payment, 1000);
  assert.equal(l.interest, 0);
  assert.equal(l.total, 12000);
});

test('monthly prepayment shortens the loan and cuts interest', () => {
  const base = loan(100000, 12, 12);
  const pre = loan(100000, 12, 12, 5000);
  assert.equal(pre.rows.length, 8);
  assert.ok(pre.interest < base.interest);
  assert.ok(pre.rows.at(-1).balance < 1e-6);
});

test('incomeTax follows the new regime slabs with rebate and marginal relief', () => {
  const cases = new Map([
    [0, 0], [400000, 0], [800000, 0], [1200000, 0],       // 87A rebate
    [1250000, 52000],   // marginal relief: tax capped at income over 12L + 4% cess
    [1300000, 78000],   // 75000 slab tax + cess
    [1600000, 124800], [2400000, 312000], [5000000, 1123200],
  ]);
  for (const [income, expected] of cases)
    assert.ok(Math.abs(incomeTax(income) - expected) < 0.01, `income ${income}: ${incomeTax(income)}`);
});

test('indianWords renders Indian numbering with singular and plural units', () => {
  assert.equal(indianWords(0), 'Zero Rupees Only');
  assert.equal(indianWords(1), 'One Rupee Only');
  assert.equal(indianWords(2), 'Two Rupees Only');
  assert.equal(indianWords(1.01), 'One Rupee and One Paisa Only');
  assert.equal(indianWords(2.02), 'Two Rupees and Two Paise Only');
  assert.equal(indianWords(100000), 'One Lakh Rupees Only');
  assert.equal(indianWords(10000000), 'One Crore Rupees Only');
  assert.equal(indianWords(123456.78), 'One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees and Seventy Eight Paise Only');
});

test('dayUTC accepts real dates and rejects impossible or malformed ones', () => {
  assert.equal(dayUTC('2024-02-29').toISOString(), '2024-02-29T00:00:00.000Z');
  for (const bad of ['2023-02-29', '2024-13-01', '2024-00-10', 'not-a-date', '2024-2-9', ''])
    assert.throws(() => dayUTC(bad), undefined, bad);
});

test('upiURI encodes payee details and omits a zero amount', () => {
  assert.equal(upiURI('sourav@upi', 'Sourav Garai', 120.5), 'upi://pay?pa=sourav%40upi&pn=Sourav+Garai&cu=INR&am=120.50');
  assert.equal(upiURI('sourav@upi', 'Sourav & Sons', 0), 'upi://pay?pa=sourav%40upi&pn=Sourav+%26+Sons&cu=INR');
});

test('textLine makes text safe for the PDF standard fonts', () => {
  assert.equal(textLine('₹1,000 – done “ok” ✓'), 'Rs. 1,000 - done ?ok? ?');
});

const { unesc, strip, tag } = loadNewsHelpers();

test('unesc decodes entities without double-decoding', () => {
  assert.equal(unesc('&lt;b&gt; &quot;q&quot; &#39; &amp;'), '<b> "q" \' &');
  assert.equal(unesc('&amp;lt;'), '&lt;');
  assert.equal(unesc('AT&amp;T'), 'AT&T');
});

test('strip removes CDATA wrappers and tags and collapses whitespace', () => {
  assert.equal(strip('<![CDATA[Hello   <b>world</b>]]>'), 'Hello world');
  assert.equal(strip('  A &amp; B  '), 'A & B');
});

test('tag pulls the first matching element content', () => {
  const xml = '<item><title>One</title><link>https://a.test</link></item><item><title>Two</title></item>';
  assert.equal(tag(xml, 'title'), 'One');
  assert.equal(tag(xml, 'missing'), '');
  assert.equal(tag('<source url="https://x.test">PTI</source>', 'source'), 'PTI');
});
