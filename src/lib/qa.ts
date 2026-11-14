// QA deep links for the CI simulator run. Only honoured when QA_MODE is on (test builds).
//   scanwise://qa/scan?raw=<text>   run the same handler as a camera scan (camera fallback on the simulator)
//   scanwise://qa/pro/off           forget Pro in memory (start the flow free)
export type QaCommand = { kind: 'scan'; raw: string } | { kind: 'pro'; on: boolean };

export function parseQaUrl(url: string | null | undefined): QaCommand | null {
  if (!url) return null;
  const m = /^scanwise:\/\/\/?qa\/(scan|pro)(?:\/(on|off))?\/?(?:\?(.*))?$/.exec(url.trim());
  if (!m) return null;
  if (m[1] === 'pro') return m[2] ? { kind: 'pro', on: m[2] === 'on' } : null;
  if (m[2]) return null;
  const q = new URLSearchParams(m[3] ?? '');
  const raw = q.get('raw');
  return raw ? { kind: 'scan', raw } : null;
}
