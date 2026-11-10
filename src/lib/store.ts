import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import type { ContentKind, Verdict } from './shield';

/** Tiny persisted store: sync reads for the UI, async writes to disk. */
function createStore<T>(key: string, initial: T) {
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const load = AsyncStorage.getItem(key)
    .then((v) => {
      if (v) state = { ...(typeof initial === 'object' && !Array.isArray(initial) ? initial : {}), ...JSON.parse(v) } as T;
      if (v && Array.isArray(initial)) state = JSON.parse(v) as T;
    })
    .catch(() => {})
    .finally(() => {
      loaded = true;
      emit();
    });

  return {
    ready: () => load,
    isLoaded: () => loaded,
    get: () => state,
    set(next: T) {
      state = next;
      emit();
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

/* ---------- settings ---------- */

export type Settings = { haptics: boolean; saveHistory: boolean; beep: boolean };
const settingsStore = createStore<Settings>('scanwise.settings.v1', {
  haptics: true,
  saveHistory: true,
  beep: false,
});

export const getSettings = () => settingsStore.get();
export const setSettings = (patch: Partial<Settings>) => settingsStore.set({ ...settingsStore.get(), ...patch });
export const useSettings = () =>
  useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.get);

/* ---------- history ---------- */

export type HistoryItem = {
  id: string;
  raw: string;
  format: string; // 'qr', 'ean13', ...
  source: 'scan' | 'create';
  kind: ContentKind;
  verdict: Verdict;
  title: string;
  ts: number;
  fav?: boolean;
};

const historyStore = createStore<HistoryItem[]>('scanwise.history.v1', []);
const MAX_ITEMS = 500;

export const useHistory = () =>
  useSyncExternalStore(historyStore.subscribe, historyStore.get, historyStore.get);

export function addHistory(item: Omit<HistoryItem, 'id' | 'ts'>): HistoryItem | null {
  if (!getSettings().saveHistory) return null;
  const list = historyStore.get();
  const now = Date.now();
  const dupe = list.find((h) => h.raw === item.raw && h.source === item.source && now - h.ts < 5000);
  if (dupe) return dupe;
  const full: HistoryItem = { ...item, id: `${now}-${Math.random().toString(36).slice(2, 7)}`, ts: now };
  historyStore.set([full, ...list].slice(0, MAX_ITEMS));
  return full;
}

export function toggleFavorite(id: string) {
  historyStore.set(historyStore.get().map((h) => (h.id === id ? { ...h, fav: !h.fav } : h)));
}

export function removeHistory(id: string) {
  historyStore.set(historyStore.get().filter((h) => h.id !== id));
}

export function clearHistory(keepFavorites = true) {
  historyStore.set(keepFavorites ? historyStore.get().filter((h) => h.fav) : []);
}
