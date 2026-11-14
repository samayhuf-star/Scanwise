import { router } from 'expo-router';
import type { ProFeature } from './pro';
import { initIAP, onEntitlementChange, refreshEntitlements } from './purchases';
import { getPro, setPro } from './store';

let started = false;

/** Connects to the store once, re-checks current entitlements and keeps the cached Pro flag in sync. */
export function startEntitlements() {
  if (started) return;
  started = true;
  onEntitlementChange((active) => setPro(active));
  initIAP()
    .then((ok) => (ok ? refreshEntitlements() : null))
    .then((active) => {
      if (active !== null) setPro(active);
    })
    .catch(() => {});
}

/** Runs `action` for Pro users. Free users get the paywall for that feature instead. Returns true when the action ran. */
export function requirePro(feature: ProFeature, action?: () => void): boolean {
  if (getPro()) {
    action?.();
    return true;
  }
  router.push({ pathname: '/paywall', params: { feature } });
  return false;
}
