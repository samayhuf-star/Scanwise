import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { INAPP_PRODUCT_IDS, PRODUCT_CATALOG, PRODUCT_IDS, SUB_PRODUCT_IDS, SUBSCRIPTION_GROUP } from '../src/lib/pro.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sk = JSON.parse(readFileSync(join(root, 'qa/Scanwise.storekit'), 'utf8'));
type Sub = { productID: string; recurringSubscriptionPeriod: string; displayPrice: string; introductoryOffer?: { paymentMode: string; subscriptionPeriod: string } };
const subs: Sub[] = sk.subscriptionGroups.flatMap((g: { subscriptions: Sub[] }) => g.subscriptions);

describe('StoreKit test config', () => {
  it('one group named Scanwise Pro with exactly the code product ids', () => {
    assert.equal(sk.subscriptionGroups.length, 1);
    assert.equal(sk.subscriptionGroups[0].name, SUBSCRIPTION_GROUP);
    assert.deepEqual(subs.map((s) => s.productID).sort(), [...SUB_PRODUCT_IDS].sort());
  });
  it('periods and test prices', () => {
    const want: Record<string, [string, string]> = { month: ['P1M', '2.99'], year: ['P1Y', '19.99'] };
    for (const p of PRODUCT_CATALOG.filter((x) => x.type === 'subs')) {
      const s = subs.find((x) => x.productID === p.id)!;
      assert.equal(s.recurringSubscriptionPeriod, want[p.period][0]);
      assert.equal(s.displayPrice, want[p.period][1]);
    }
  });
  it('each sub has a 7-day free-trial intro offer', () => {
    for (const s of subs) assert.deepEqual({ m: s.introductoryOffer?.paymentMode, p: s.introductoryOffer?.subscriptionPeriod }, { m: 'free', p: 'P1W' });
  });
  it('has the lifetime non-consumable at $39.99 with no trial', () => {
    assert.equal(sk.products.length, 1);
    const l = sk.products[0];
    assert.equal(l.productID, PRODUCT_IDS.lifetime);
    assert.equal(l.type, 'NonConsumable');
    assert.equal(l.displayPrice, '39.99');
    assert.equal(l.introductoryOffer, undefined);
    assert.deepEqual(INAPP_PRODUCT_IDS, [PRODUCT_IDS.lifetime]);
  });
  it('is not wired into the app config', () => {
    for (const f of ['app.json', 'eas.json']) assert.doesNotMatch(readFileSync(join(root, f), 'utf8'), /storekit/i);
  });
});
