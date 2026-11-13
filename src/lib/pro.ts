// Scanwise Pro: product ids, legal links and the free-vs-Pro split. Change here only.
// Pure module with no native imports, so it can be unit tested with node --test.

export const BUNDLE_ID = 'com.samayhuf.scanwise';

export const PRODUCT_IDS = {
  monthly: `${BUNDLE_ID}.pro.monthly`,
  yearly: `${BUNDLE_ID}.pro.yearly`,
  lifetime: `${BUNDLE_ID}.pro.lifetime`,
} as const;

/** Optional one-time lifetime unlock (non-consumable, no trial). Turn OFF if Samay declines lifetime. */
export const LIFETIME_ENABLED = true;

export const SUBSCRIPTION_GROUP = 'Scanwise Pro';

export type PlanKind = 'yearly' | 'monthly' | 'lifetime';
export type ProductDef = { id: string; kind: PlanKind; type: 'subs' | 'in-app'; label: string; period: 'month' | 'year' | 'once' };

const SUBSCRIPTIONS: ProductDef[] = [
  { id: PRODUCT_IDS.yearly, kind: 'yearly', type: 'subs', label: 'Yearly', period: 'year' },
  { id: PRODUCT_IDS.monthly, kind: 'monthly', type: 'subs', label: 'Monthly', period: 'month' },
];
const LIFETIME: ProductDef = { id: PRODUCT_IDS.lifetime, kind: 'lifetime', type: 'in-app', label: 'Lifetime', period: 'once' };

export function buildCatalog(lifetime: boolean): ProductDef[] {
  return lifetime ? [...SUBSCRIPTIONS, LIFETIME] : [...SUBSCRIPTIONS];
}

export const PRODUCT_CATALOG: ProductDef[] = buildCatalog(LIFETIME_ENABLED);
export const SUB_PRODUCT_IDS: string[] = PRODUCT_CATALOG.filter((p) => p.type === 'subs').map((p) => p.id);
export const INAPP_PRODUCT_IDS: string[] = PRODUCT_CATALOG.filter((p) => p.type === 'in-app').map((p) => p.id);

export const ALL_PRODUCT_IDS: string[] = PRODUCT_CATALOG.map((p) => p.id);
export const isKnownProduct = (id: string | null | undefined) => !!id && ALL_PRODUCT_IDS.includes(id);

export const PRIVACY_URL = 'https://samayhuf-star.github.io/app-legal/scanwise/privacy.html';
export const TERMS_URL = 'https://samayhuf-star.github.io/app-legal/scanwise/terms.html';
/** Apple's standard licence agreement, linked next to our own terms on the paywall. */
export const APPLE_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

// QA builds only. The CI simulator run sets EXPO_PUBLIC_SCANWISE_QA=1; store builds never do.
export const QA_MODE = process.env.EXPO_PUBLIC_SCANWISE_QA === '1';

/* ---------- free vs Pro ---------- */

/** Free users see the newest 20 history entries plus everything they starred. Nothing is deleted. */
export const FREE_HISTORY_LIMIT = 20;

/** QR content types that stay free forever. */
export const FREE_QR_TYPES = ['url', 'text', 'wifi', 'contact', 'email', 'phone', 'sms'] as const;
/** QR content types that need Pro. */
export const PRO_QR_TYPES = ['upi'] as const;

/** QR colour that stays free. Other colours need Pro. */
export const FREE_QR_COLOR = '#000000';

export type ProFeature = 'barcodes' | 'upi' | 'colors' | 'history' | 'batch' | 'export';

export const PRO_FEATURES: { id: ProFeature; title: string; detail: string }[] = [
  { id: 'barcodes', title: 'Barcode generator', detail: 'Code 128, EAN-13, EAN-8, UPC-A, Code 39 and ITF-14' },
  { id: 'upi', title: 'UPI payment QR codes', detail: 'Payee, amount and note in one code' },
  { id: 'colors', title: 'Custom code colours', detail: 'Navy, green and purple codes' },
  { id: 'history', title: 'Unlimited history', detail: `Free keeps the newest ${FREE_HISTORY_LIMIT} plus starred items` },
  { id: 'batch', title: 'Batch QR codes', detail: 'One QR code per line, shared together' },
  { id: 'export', title: 'History export', detail: 'Save your whole history as a CSV file' },
];

export const FREE_FEATURES: string[] = [
  'Scan QR codes and barcodes with the camera or from a photo',
  'Safe-Link Shield checks on every scan',
  'Create QR codes for links, text, Wi-Fi, contacts, email, phone and SMS',
  `History of your newest ${FREE_HISTORY_LIMIT} scans and codes, plus starred items`,
];

export function isProQrType(type: string): boolean {
  return (PRO_QR_TYPES as readonly string[]).includes(type);
}

export function isProColor(color: string): boolean {
  return color.toUpperCase() !== FREE_QR_COLOR.toUpperCase();
}

/** Which history entries the user can see. Pro sees all. Free sees the newest N plus starred ones. */
export function visibleHistory<T extends { fav?: boolean }>(items: T[], isPro: boolean, limit = FREE_HISTORY_LIMIT): { visible: T[]; hidden: number } {
  if (isPro) return { visible: items, hidden: 0 };
  const visible = items.filter((h, i) => i < limit || !!h.fav);
  return { visible, hidden: items.length - visible.length };
}

/* ---------- batch ---------- */

export const BATCH_MAX = 30;

/** Splits pasted text into one payload per non-empty line, trimmed, de-duplicated, capped. */
export function batchLines(text: string, max = BATCH_MAX): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const v = line.trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

/* ---------- export ---------- */

const csvCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function historyCsv(items: { ts: number; source: string; format: string; verdict: string; title: string; raw: string; fav?: boolean }[]): string {
  const rows = [['date', 'source', 'format', 'verdict', 'title', 'content', 'starred'].join(',')];
  for (const h of items) {
    rows.push(
      [new Date(h.ts).toISOString(), h.source, h.format, h.verdict, h.title, h.raw, h.fav ? 'yes' : 'no'].map((x) => csvCell(String(x))).join(','),
    );
  }
  return rows.join('\n') + '\n';
}
