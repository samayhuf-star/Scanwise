import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ctaText, freeTrialDays, planLine, renewalDisclosure } from '../src/lib/introOffer.ts';

describe('freeTrialDays', () => {
  it('reads a 1-week free trial from subscriptionOffers', () => {
    assert.equal(freeTrialDays({ subscriptionOffers: [{ type: 'introductory', paymentMode: 'free-trial', period: { unit: 'week', value: 1 }, periodCount: 1 }] }), 7);
  });
  it('falls back to the iOS intro fields', () => {
    assert.equal(freeTrialDays({ introductoryPricePaymentModeIOS: 'free-trial', introductoryPriceSubscriptionPeriodIOS: 'week', introductoryPriceNumberOfPeriodsIOS: '1' }), 7);
  });
  it('ignores paid intro offers and missing products', () => {
    assert.equal(freeTrialDays({ subscriptionOffers: [{ type: 'introductory', paymentMode: 'pay-as-you-go', period: { unit: 'month', value: 1 } }] }), null);
    assert.equal(freeTrialDays(null), null);
  });
});

describe('paywall copy', () => {
  it('shows the trial CTA only for an eligible trial', () => {
    assert.equal(ctaText({ price: '$2.99', period: 'month', trialDays: 7 }), 'Try 7 days free, then $2.99/month');
    assert.equal(ctaText({ price: '$19.99', period: 'year', trialDays: 7 }), 'Try 7 days free, then $19.99/year');
    assert.equal(ctaText({ price: '$2.99', period: 'month', trialDays: null }), 'Subscribe for $2.99/month');
  });
  it('uses the store price string as given (localized)', () => {
    assert.equal(planLine({ price: '₹299.00', period: 'month', trialDays: null }), '₹299.00/month');
    assert.equal(planLine({ price: '19,99 €', period: 'year', trialDays: 7 }), '7 days free, then 19,99 €/year');
  });
  it('discloses auto-renewal, with the trial sentence only when there is a trial', () => {
    assert.match(renewalDisclosure(true), /^After the free trial/);
    assert.match(renewalDisclosure(false), /renews automatically/);
    assert.doesNotMatch(renewalDisclosure(false), /free trial/);
    assert.match(renewalDisclosure(false, 'Google Play'), /Google Play/);
  });
});
