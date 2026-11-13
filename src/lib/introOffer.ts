// Introductory free-trial copy for the paywall. Pure, no native imports, so it can be unit tested.

type Period = { unit?: string | null; value?: number | null } | null | undefined;
export interface OfferLike {
  type?: string | null;
  paymentMode?: string | null;
  period?: Period;
  periodCount?: number | null;
}
export interface ProductLike {
  subscriptionOffers?: OfferLike[] | null;
  introductoryPricePaymentModeIOS?: string | null;
  introductoryPriceSubscriptionPeriodIOS?: string | null;
  introductoryPriceNumberOfPeriodsIOS?: string | null;
}

const DAYS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

/** Length in days of the product's introductory free trial, or null when it has none. */
export function freeTrialDays(p: ProductLike | null | undefined): number | null {
  if (!p) return null;
  for (const o of p.subscriptionOffers ?? []) {
    if (o?.type !== 'introductory' || o.paymentMode !== 'free-trial') continue;
    const per = DAYS[o.period?.unit ?? ''];
    if (!per) continue;
    const days = per * (o.period?.value || 1) * (o.periodCount || 1);
    if (days > 0) return days;
  }
  if (p.introductoryPricePaymentModeIOS === 'free-trial') {
    const per = DAYS[p.introductoryPriceSubscriptionPeriodIOS ?? ''];
    const n = parseInt(p.introductoryPriceNumberOfPeriodsIOS ?? '1', 10) || 1;
    if (per) return per * n;
  }
  return null;
}

type PlanText = { price: string; period: 'month' | 'year' | 'once'; trialDays?: number | null };

/** Main button. The trial wording shows only when the store reports an eligible free trial. */
export function ctaText(plan: PlanText): string {
  if (plan.period === 'once') return `Buy once for ${plan.price}`;
  if (plan.trialDays && plan.trialDays > 0) return `Try ${plan.trialDays} days free, then ${plan.price}/${plan.period}`;
  return `Subscribe for ${plan.price}/${plan.period}`;
}

/** Plan row. Price always comes from the store, never from code. */
export function planLine(plan: PlanText): string {
  if (plan.period === 'once') return `${plan.price} once, yours to keep`;
  if (plan.trialDays && plan.trialDays > 0) return `${plan.trialDays} days free, then ${plan.price}/${plan.period}`;
  return `${plan.price}/${plan.period}`;
}

/** Auto-renew disclosure under the button. A lifetime purchase is a single charge with no renewal. */
export function renewalDisclosure(hasTrial: boolean, store: 'Apple ID' | 'Google Play' = 'Apple ID', lifetime = false): string {
  if (lifetime) return `Lifetime is a one-time purchase charged to your ${store} account. It does not renew.`;
  return [
    hasTrial ? 'After the free trial, the subscription starts automatically unless you cancel at least 24 hours before the trial ends.' : '',
    `Payment is charged to your ${store} account. Scanwise Pro renews automatically at the same price each period unless cancelled at least 24 hours before the period ends.`,
    `Manage or cancel anytime in your ${store} subscription settings.`,
  ]
    .filter(Boolean)
    .join(' ');
}
