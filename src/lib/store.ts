import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { expiryFor, type PassStatus, type PlanId } from './pass';
import { isPro } from './purchases';

/** Tiny persisted store: sync reads for the UI, async writes to disk. Everything stays on this device. */
function createStore<T>(key: string, initial: T) {
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const load = AsyncStorage.getItem(key)
    .then((v) => {
      if (!v) return;
      const parsed = JSON.parse(v);
      state = Array.isArray(initial) ? (parsed as T) : ({ ...initial, ...parsed } as T);
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

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ---------- settings ---------- */

export type Settings = { haptics: boolean; onboarded: boolean; venueName: string };
const settingsStore = createStore<Settings>('passdesk.settings.v1', {
  haptics: true,
  onboarded: false,
  venueName: '',
});
export const settingsReady = () => settingsStore.ready();
export const settingsLoaded = () => settingsStore.isLoaded();
export const getSettings = () => settingsStore.get();
export const setSettings = (patch: Partial<Settings>) => settingsStore.set({ ...settingsStore.get(), ...patch });
export const useSettings = () =>
  useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.get);

/* ---------- members ---------- */

export type Member = { id: string; name: string; plan: PlanId; expires: number | null; createdAt: number; note?: string };
const memberStore = createStore<Member[]>('passdesk.members.v1', []);
export const FREE_MEMBER_LIMIT = 10;

export const useMembers = () => useSyncExternalStore(memberStore.subscribe, memberStore.get, memberStore.get);
export const getMembers = () => memberStore.get();
export const findMember = (id: string) => memberStore.get().find((m) => m.id === id);
export const canAddMember = () => isPro() || memberStore.get().length < FREE_MEMBER_LIMIT;

export function addMember(name: string, plan: PlanId, note?: string): Member | null {
  const clean = name.trim();
  if (!clean || !canAddMember()) return null;
  const m: Member = { id: uid(), name: clean, plan, expires: expiryFor(plan), createdAt: Date.now(), note: note?.trim() || undefined };
  memberStore.set([m, ...memberStore.get()]);
  return m;
}

export function renewMember(id: string, plan: PlanId) {
  memberStore.set(
    memberStore.get().map((m) => {
      if (m.id !== id) return m;
      const base = m.expires && m.expires > Date.now() ? m.expires + 1 : Date.now();
      return { ...m, plan, expires: expiryFor(plan, base) };
    }),
  );
}

export function removeMember(id: string) {
  memberStore.set(memberStore.get().filter((m) => m.id !== id));
}

/* ---------- check-ins ---------- */

export type CheckIn = { id: string; memberId: string; name: string; ts: number; status: PassStatus | 'unknown' };
const checkinStore = createStore<CheckIn[]>('passdesk.checkins.v1', []);
const MAX_LOG = 5000;

export const useCheckIns = () => useSyncExternalStore(checkinStore.subscribe, checkinStore.get, checkinStore.get);

export function recordCheckIn(c: Omit<CheckIn, 'id' | 'ts'>): CheckIn {
  const full: CheckIn = { ...c, id: uid(), ts: Date.now() };
  checkinStore.set([full, ...checkinStore.get()].slice(0, MAX_LOG));
  return full;
}

export function clearCheckIns() {
  checkinStore.set([]);
}

export const toCsv = (rows: CheckIn[]) =>
  ['time,member,result', ...rows.map((r) => `${new Date(r.ts).toISOString()},"${r.name.replace(/"/g, '""')}",${r.status}`)].join('\n');
