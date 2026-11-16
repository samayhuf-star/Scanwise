import { useSyncExternalStore } from 'react';
import { Alert, Platform } from 'react-native';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

/** Entitlement id configured in the RevenueCat dashboard. Features are gated on this, never on product ids. */
export const ENTITLEMENT = 'premium';
const IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY;

let pro = false;
let configured = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function apply(info: CustomerInfo) {
  const next = !!info.entitlements.active[ENTITLEMENT];
  if (next !== pro) {
    pro = next;
    emit();
  }
}

export function initPurchases() {
  if (configured || Platform.OS !== 'ios' || !IOS_KEY) return;
  try {
    Purchases.configure({ apiKey: IOS_KEY });
    configured = true;
    Purchases.addCustomerInfoUpdateListener(apply);
    Purchases.getCustomerInfo().then(apply).catch(() => {});
  } catch {
    configured = false;
  }
}

export const purchasesReady = () => configured;
export const isPro = () => pro;
export const useIsPro = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => pro,
    () => pro,
  );

const unavailable = () =>
  Alert.alert('Purchases unavailable', 'Subscriptions are not available in this build. Please update the app and try again.');

/** Shows the RevenueCat-hosted paywall attached to the current offering. */
export async function showPaywall(): Promise<boolean> {
  if (!configured) {
    unavailable();
    return false;
  }
  try {
    await RevenueCatUI.presentPaywall();
  } catch {
    Alert.alert('Something went wrong', 'The paywall could not be shown. Please try again.');
  }
  return pro;
}

export async function restore() {
  if (!configured) return unavailable();
  try {
    const info = await Purchases.restorePurchases();
    apply(info);
    Alert.alert(pro ? 'Purchases restored' : 'Nothing to restore', pro ? 'Scanwise Pro is active.' : 'No active subscription was found for this Apple ID.');
  } catch {
    Alert.alert('Restore failed', 'Please check your connection and try again.');
  }
}

export async function manageSubscription() {
  if (!configured) return unavailable();
  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch {
    Alert.alert('Something went wrong', 'Subscription management could not be opened.');
  }
}
