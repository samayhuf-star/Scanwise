// Onboarding content and the "seen" flag. Pure data + AsyncStorage; the screen lives in src/app/onboarding.tsx.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_SCREENS = 10;
const KEY = 'scanwise.onboarded.v1';

export type Slide = { id: string; icon: string; title: string; body: string; kind?: 'push' | 'finish' };

export const SLIDES: Slide[] = [
  { id: 'welcome', icon: 'scan', title: 'Welcome to Scanwise', body: 'A fast, private QR and barcode scanner that checks every link before you open it.' },
  { id: 'camera', icon: 'camera', title: 'Point and scan', body: 'QR codes and barcodes are read instantly with the camera. Nothing is uploaded.' },
  { id: 'photo', icon: 'images', title: 'Scan from a photo', body: 'Got a screenshot or a saved picture? Pick it and Scanwise reads the code in it.' },
  { id: 'shield', icon: 'shield-checkmark', title: 'Safe-Link Shield', body: 'Every link is checked on your phone for lookalike domains, shorteners and risky patterns.' },
  { id: 'create', icon: 'qr-code', title: 'Create QR codes', body: 'Links, text, Wi-Fi, contacts, email, phone and SMS. Static codes that never expire.' },
  { id: 'history', icon: 'time', title: 'Your history, on device', body: 'Scans and codes you make are saved only on this phone. Star the ones you want to keep.' },
  { id: 'pro', icon: 'barcode', title: 'Barcodes and UPI with Pro', body: 'Make Code 128, EAN-13, UPC-A and more, plus UPI payment codes and coloured codes.' },
  { id: 'batch', icon: 'layers', title: 'Batch and export', body: 'Pro turns a pasted list into many QR codes at once and exports your history as CSV.' },
  { id: 'push', icon: 'notifications', title: 'Tips and updates', body: 'Get an occasional tip or new-feature note. Optional, off unless you turn it on, and you can change it in Settings.', kind: 'push' },
  { id: 'finish', icon: 'sparkles', title: 'You are all set', body: 'Scanning and Safe-Link Shield are free forever. Try Pro free for 7 days to unlock everything.', kind: 'finish' },
];

export async function hasOnboarded(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return true;
  }
}

export function markOnboarded(): void {
  AsyncStorage.setItem(KEY, '1').catch(() => {});
}
