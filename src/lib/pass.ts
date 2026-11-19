/** Member pass format. Passes are plain QR text so any phone can show them; PassDesk validates them offline. */
export type PlanId = 'day' | 'month' | 'quarter' | 'year' | 'open';

export const PLANS: { id: PlanId; label: string; days: number | null }[] = [
  { id: 'day', label: 'Day pass', days: 1 },
  { id: 'month', label: 'Monthly', days: 30 },
  { id: 'quarter', label: '3 months', days: 90 },
  { id: 'year', label: 'Yearly', days: 365 },
  { id: 'open', label: 'No expiry', days: null },
];

export const planLabel = (id: PlanId) => PLANS.find((p) => p.id === id)?.label ?? 'Member';

export function expiryFor(plan: PlanId, from = Date.now()): number | null {
  const days = PLANS.find((p) => p.id === plan)?.days ?? null;
  if (days === null) return null;
  const d = new Date(from);
  d.setHours(23, 59, 59, 999);
  return d.getTime() + (days - 1) * 86_400_000;
}

const PREFIX = 'PASSDESK1';

export type PassPayload = { memberId: string; name: string; expires: number | null };

export function encodePass(p: PassPayload): string {
  const name = p.name.replace(/[|]/g, ' ').trim();
  return [PREFIX, p.memberId, name, p.expires ?? ''].join('|');
}

export function parsePass(raw: string): PassPayload | null {
  const parts = raw.split('|');
  if (parts.length !== 4 || parts[0] !== PREFIX || !parts[1]) return null;
  const expires = parts[3] === '' ? null : Number(parts[3]);
  if (expires !== null && !Number.isFinite(expires)) return null;
  return { memberId: parts[1], name: parts[2] || 'Member', expires };
}

export type PassStatus = 'ok' | 'expired';

export function statusOf(expires: number | null, now = Date.now()): PassStatus {
  return expires !== null && expires < now ? 'expired' : 'ok';
}

export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
export const sameDay = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString();
