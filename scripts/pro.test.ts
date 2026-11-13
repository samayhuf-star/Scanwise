import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  ALL_PRODUCT_IDS,
  BATCH_MAX,
  BUNDLE_ID,
  FREE_HISTORY_LIMIT,
  FREE_QR_TYPES,
  INAPP_PRODUCT_IDS,
  LIFETIME_ENABLED,
  PRODUCT_CATALOG,
  SUB_PRODUCT_IDS,
  buildCatalog,
  PRIVACY_URL,
  PRODUCT_IDS,
  TERMS_URL,
  batchLines,
  historyCsv,
  isKnownProduct,
  isProColor,
  isProQrType,
  visibleHistory,
} from '../src/lib/pro.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('product ids', () => {
  it('follow the bundle id from app.json', () => {
    const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'));
    assert.equal(app.expo.ios.bundleIdentifier, BUNDLE_ID);
    assert.equal(PRODUCT_IDS.monthly, 'com.samayhuf.scanwise.pro.monthly');
    assert.equal(PRODUCT_IDS.yearly, 'com.samayhuf.scanwise.pro.yearly');
    assert.equal(PRODUCT_IDS.lifetime, 'com.samayhuf.scanwise.pro.lifetime');
  });
  it('lifetime sits behind one flag, currently on', () => {
    assert.equal(LIFETIME_ENABLED, true);
    assert.deepEqual(PRODUCT_CATALOG.map((p) => p.kind), ['yearly', 'monthly', 'lifetime']);
    assert.deepEqual(buildCatalog(false).map((p) => p.kind), ['yearly', 'monthly']);
    assert.deepEqual(SUB_PRODUCT_IDS.sort(), [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly].sort());
    assert.deepEqual(INAPP_PRODUCT_IDS, [PRODUCT_IDS.lifetime]);
  });
  it('knows only its own products', () => {
    assert.deepEqual([...ALL_PRODUCT_IDS].sort(), [PRODUCT_IDS.lifetime, PRODUCT_IDS.monthly, PRODUCT_IDS.yearly].sort());
    assert.equal(isKnownProduct(PRODUCT_IDS.monthly), true);
    assert.equal(isKnownProduct('com.samayhuf.scanwise.pro.weekly'), false);
    assert.equal(isKnownProduct(undefined), false);
  });
  it('legal links are https pages', () => {
    for (const u of [PRIVACY_URL, TERMS_URL]) assert.match(u, /^https:\/\/.+\.html$/);
  });
});

describe('free vs Pro split', () => {
  it('keeps the core QR types free', () => {
    for (const t of ['url', 'text', 'wifi', 'contact', 'email', 'phone', 'sms']) {
      assert.ok((FREE_QR_TYPES as readonly string[]).includes(t));
      assert.equal(isProQrType(t), false);
    }
    assert.equal(isProQrType('upi'), true);
  });
  it('black codes are free, other colours are Pro', () => {
    assert.equal(isProColor('#000000'), false);
    assert.equal(isProColor('#0b2a6f'), true);
  });
});

describe('history cap', () => {
  const items = Array.from({ length: 30 }, (_, i) => ({ id: String(i), fav: i === 25 }));
  it('free sees the newest 20 plus starred older items', () => {
    const { visible, hidden } = visibleHistory(items, false);
    assert.equal(FREE_HISTORY_LIMIT, 20);
    assert.equal(visible.length, 21);
    assert.equal(hidden, 9);
    assert.ok(visible.some((h) => h.id === '25'));
    assert.ok(!visible.some((h) => h.id === '24'));
  });
  it('Pro sees everything', () => {
    assert.deepEqual(visibleHistory(items, true), { visible: items, hidden: 0 });
  });
  it('nothing is hidden under the cap', () => {
    assert.equal(visibleHistory(items.slice(0, 5), false).hidden, 0);
  });
});

describe('batch', () => {
  it('one code per line, trimmed, no blanks or repeats', () => {
    assert.deepEqual(batchLines(' a.com \n\nb.com\r\na.com\n  \nc'), ['a.com', 'b.com', 'c']);
  });
  it('caps the batch', () => {
    const many = Array.from({ length: 100 }, (_, i) => `x${i}`).join('\n');
    assert.equal(batchLines(many).length, BATCH_MAX);
  });
});

describe('history export', () => {
  it('writes a quoted CSV', () => {
    const csv = historyCsv([{ ts: 0, source: 'scan', format: 'qr', verdict: 'safe', title: 'Website link', raw: 'https://a.com/?q="x",y', fav: true }]);
    const [head, row] = csv.trim().split('\n');
    assert.equal(head, 'date,source,format,verdict,title,content,starred');
    assert.equal(row, '1970-01-01T00:00:00.000Z,scan,qr,safe,Website link,"https://a.com/?q=""x"",y",yes');
  });
});
