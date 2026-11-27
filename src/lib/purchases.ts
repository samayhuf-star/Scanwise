// RevenueCat billing for Scanwise Pro. Prices, trials and entitlements come from RevenueCat/the store, never from code.
// Needs EXPO_PUBLIC_RC_IOS_KEY (public SDK key) and entitlement "pro" with the PRODUCT_CATALOG products in offering "default".
import { Platform } from 'react-native';
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import { ENTITLEMENT_ID, PRODUCT_CATALOG } from './pro';

export type Plan = (typeof PRODUCT_CATALOG)[number] & {
  price: string;
  pkg: PurchasesPackage;
  /** Free-trial days, set only when the store reports a trial AND this user is eligible. */
  trialDays: number | null;
};

export type BuyResult = 'purchased' | 'cancelled' | 'pending' | 'error';
export type PlansLoad = { plans: Plan[]; error: string | null };

const API_KEY = (Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_RC_IOS_KEY : process.env.EXPO_PUBLIC_RC_ANDROID_KEY) ?? '';
const UNAVAILABLE = 'Plans unavailable right now. Please try again shortly.';
const DAYS: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

let configured = false;
let listening = false;
const entitlementListeners = new Set<(isPremium: boolean) => void>();

const logErr = (action: string, e: unknown) => {
  const err = e as { code?: unknown; message?: string };
  console.log('[scanwise-rc]', `${action} failed`, { code: err?.code, message: err?.message });
};

const isActive = (info: CustomerInfo | null | undefined) => !!info?.entitlements.active[ENTITLEMENT_ID];

function ensureConfigured(): boolean {
  if (configured) return true;
  if (Platform.OS === 'web' || !API_KEY) return false;
  try {
    if (__DEV__) Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: API_KEY });
    if (Platform.OS === 'ios') Purchases.enableAdServicesAttributionTokenCollection().catch(() => {});
    configured = true;
  } catch (e) {
    logErr('configure', e);
  }
  return configured;
}

/** Configure RevenueCat and listen for renewals, expiry and purchases on other devices. No Apple ID prompt. */
export async function initIAP(): Promise<boolean> {
  if (!ensureConfigured()) return false;
  if (!listening) {
    listening = true;
    Purchases.addCustomerInfoUpdateListener((info) => entitlementListeners.forEach((cb) => cb(isActive(info))));
  }
  return true;
}

function trialDaysOf(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const per = DAYS[intro.periodUnit];
  if (!per) return null;
  return per * (intro.periodNumberOfUnits || 1) * (intro.cycles || 1);
}

export async function loadPlans(): Promise<PlansLoad> {
  if (!(await initIAP())) return { plans: [], error: UNAVAILABLE };
  try {
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    const ids = pkgs.map((p) => p.product.identifier);
    let eligibility: Record<string, { status: INTRO_ELIGIBILITY_STATUS }> = {};
    try {
      eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(ids);
    } catch (e) {
      logErr('checkTrialOrIntroductoryPriceEligibility', e);
    }
    const plans: Plan[] = [];
    for (const def of PRODUCT_CATALOG) {
      const pkg = pkgs.find((p) => p.product.identifier === def.id) ?? pkgs.find((p) => p.identifier === def.rcPackage);
      if (!pkg) continue;
      const days = trialDaysOf(pkg);
      const eligible = eligibility[pkg.product.identifier]?.status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;
      plans.push({ ...def, price: pkg.product.priceString, pkg, trialDays: days && eligible ? days : null });
    }
    return plans.length ? { plans, error: null } : { plans: [], error: UNAVAILABLE };
  } catch (e) {
    logErr('getOfferings', e);
    return { plans: [], error: UNAVAILABLE };
  }
}

export async function refreshEntitlements(): Promise<boolean> {
  if (!(await initIAP())) return false;
  try {
    return isActive(await Purchases.getCustomerInfo());
  } catch (e) {
    logErr('getCustomerInfo', e);
    return false;
  }
}

export function onEntitlementChange(cb: (isPremium: boolean) => void): () => void {
  entitlementListeners.add(cb);
  return () => {
    entitlementListeners.delete(cb);
  };
}

export async function buy(plan: Plan): Promise<BuyResult> {
  if (!(await initIAP())) return 'error';
  try {
    const { customerInfo } = await Purchases.purchasePackage(plan.pkg);
    return isActive(customerInfo) ? 'purchased' : 'pending';
  } catch (e) {
    const err = e as { code?: string; userCancelled?: boolean };
    if (err?.userCancelled || err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return 'cancelled';
    if (err?.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
    logErr('purchasePackage', e);
    return 'error';
  }
}

/** User-initiated only (may ask for the Apple ID). */
export async function restore(): Promise<boolean> {
  if (!(await initIAP())) return false;
  try {
    const active = isActive(await Purchases.restorePurchases());
    entitlementListeners.forEach((cb) => cb(active));
    return active;
  } catch (e) {
    logErr('restorePurchases', e);
    return false;
  }
}
