// OneSignal push for optional "Tips and updates". Consent first: OneSignal starts in consent-required
// mode and sends or collects nothing until the user opts in (onboarding or Settings). Default: off.
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';

const APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '';
const KEY = 'scanwise.pushTips';
let consent = false;
let started = false;
const listeners = new Set<(v: boolean) => void>();

function apply(v: boolean, ask: boolean) {
  if (Platform.OS === 'web' || !APP_ID) return;
  try {
    if (!started) {
      OneSignal.setConsentRequired(true);
      OneSignal.initialize(APP_ID);
      started = true;
    }
    OneSignal.setConsentGiven(v);
    if (v && ask) OneSignal.Notifications.requestPermission(false).catch(() => {});
  } catch {
    /* push is optional */
  }
}

/** Call once at launch: starts OneSignal in consent-required mode with the saved choice. */
export function initPush(): void {
  AsyncStorage.getItem(KEY)
    .then((v) => {
      consent = v === '1';
      listeners.forEach((l) => l(consent));
      apply(consent, false);
    })
    .catch(() => apply(false, false));
}

export function setPushConsent(v: boolean): void {
  consent = v;
  AsyncStorage.setItem(KEY, v ? '1' : '0').catch(() => {});
  listeners.forEach((l) => l(v));
  apply(v, true);
}

export function usePushConsent(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(consent);
  useEffect(() => {
    listeners.add(setOn);
    return () => {
      listeners.delete(setOn);
    };
  }, []);
  return [on, useCallback((v: boolean) => setPushConsent(v), [])];
}
