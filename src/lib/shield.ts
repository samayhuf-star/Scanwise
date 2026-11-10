/**
 * Safe-Link Shield: fully on-device analysis of whatever a code contains.
 * Nothing here touches the network. It is a heuristic check, not a guarantee.
 */

export type Verdict = 'safe' | 'caution' | 'danger' | 'info';
export type ContentKind =
  | 'url'
  | 'wifi'
  | 'upi'
  | 'email'
  | 'phone'
  | 'sms'
  | 'geo'
  | 'contact'
  | 'event'
  | 'product'
  | 'text';

export type Finding = { level: 'ok' | 'info' | 'warn' | 'bad'; text: string };
export type Field = { label: string; value: string; secret?: boolean };
export type ActionKind = 'open' | 'copy' | 'share' | 'call' | 'mail' | 'sms' | 'map' | 'search';
export type Action = { kind: ActionKind; label: string; value: string; primary?: boolean };

export type Analysis = {
  kind: ContentKind;
  verdict: Verdict;
  title: string;
  headline: string;
  findings: Finding[];
  fields: Field[];
  actions: Action[];
};

const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly',
  'shorturl.at', 'tiny.cc', 'rb.gy', 'lnkd.in', 'bl.ink', 'v.gd', 's.id', 'qr.io', 'qrco.de',
  'qr.page', 'q.me-qr.com', 'l.ead.me', 'linktr.ee',
]);

const RISKY_TLDS = new Set([
  'zip', 'mov', 'tk', 'ml', 'ga', 'cf', 'gq', 'top', 'click', 'country', 'support', 'rest', 'icu',
  'cyou', 'cfd', 'sbs', 'monster', 'buzz', 'work', 'loan', 'review', 'men', 'xin',
]);

const BRANDS = [
  'paypal', 'google', 'apple', 'microsoft', 'amazon', 'netflix', 'facebook', 'instagram', 'whatsapp',
  'paytm', 'phonepe', 'gpay', 'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'flipkart', 'swiggy', 'zomato',
  'irctc', 'aadhaar', 'uidai', 'binance', 'coinbase', 'metamask', 'dhl', 'fedex', 'ups', 'usps',
  'chase', 'wellsfargo', 'citibank', 'barclays', 'hsbc', 'linkedin', 'twitter', 'dropbox', 'adobe',
];

const BAIT_WORDS = [
  'login', 'signin', 'verify', 'secure', 'update', 'wallet', 'password', 'otp', 'kyc', 'refund',
  'claim', 'prize', 'reward', 'gift', 'giveaway', 'suspend', 'unlock', 'recover', 'confirm',
];

const RISKY_FILES = /\.(apk|exe|msi|dmg|pkg|scr|bat|cmd|jar|ipa|mobileconfig|vbs|ps1)(\?|#|$)/i;
const TWO_PART_SLD = new Set(['co', 'com', 'org', 'net', 'gov', 'ac', 'edu', 'nic']);

type ParsedUrl = {
  scheme: string;
  userinfo?: string;
  host: string;
  port?: string;
  path: string;
  query: string;
  hash: string;
};

export function parseUrl(input: string): ParsedUrl | null {
  const m = input.match(
    /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(?:([^@/?#]*)@)?(\[[^\]]+\]|[^:/?#]+)(?::(\d+))?([^?#]*)(\?[^#]*)?(#.*)?$/,
  );
  if (!m) return null;
  return {
    scheme: m[1].toLowerCase(),
    userinfo: m[2],
    host: m[3].toLowerCase(),
    port: m[4],
    path: m[5] ?? '',
    query: m[6] ?? '',
    hash: m[7] ?? '',
  };
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

function registrable(host: string): { domain: string; label: string; tld: string; subdomains: number } {
  const parts = host.split('.');
  if (parts.length <= 2) {
    return { domain: host, label: parts[0] ?? host, tld: parts[parts.length - 1] ?? '', subdomains: 0 };
  }
  const tld = parts[parts.length - 1];
  const sld = parts[parts.length - 2];
  const take = tld.length === 2 && TWO_PART_SLD.has(sld) ? 3 : 2;
  const domain = parts.slice(-take).join('.');
  return { domain, label: parts[parts.length - take], tld, subdomains: parts.length - take };
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

export function looksLikeUrl(raw: string): string | null {
  const s = raw.trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s) && !/\s/.test(s)) return 'https://' + s;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(s) && !/\s/.test(s)) {
    const tld = s.split('/')[0].split('.').pop() ?? '';
    if (/^[a-z]{2,}$/i.test(tld)) return 'https://' + s;
  }
  return null;
}

function analyzeUrl(rawUrl: string, original: string): Analysis {
  const findings: Finding[] = [];
  const u = parseUrl(rawUrl);
  const actions: Action[] = [];
  if (!u) {
    return {
      kind: 'url',
      verdict: 'caution',
      title: 'Link',
      headline: 'This link is malformed',
      findings: [{ level: 'warn', text: 'The address could not be read as a normal web link.' }],
      fields: [{ label: 'Content', value: original }],
      actions: [{ kind: 'copy', label: 'Copy', value: original }],
    };
  }

  let bad = 0;
  let warn = 0;
  const add = (level: Finding['level'], text: string) => {
    findings.push({ level, text });
    if (level === 'bad') bad++;
    if (level === 'warn') warn++;
  };

  if (!['http', 'https'].includes(u.scheme)) {
    add('bad', `Uses the "${u.scheme}:" scheme instead of a normal web link.`);
  } else if (u.scheme === 'http') {
    add('warn', 'Not encrypted (http). Anything you type on this page can be read on the network.');
  }

  if (u.userinfo !== undefined) {
    add('bad', 'Contains "@" before the real address. What you see first is not where the link goes.');
  }

  const host = u.host.replace(/\.$/, '');
  const isIp = IPV4.test(host) || host.startsWith('[');
  if (isIp) add('bad', 'Points to a raw IP address instead of a named website.');

  if (host.split('.').some((l) => l.startsWith('xn--'))) {
    add('bad', 'Uses look-alike (punycode) characters that can imitate a real brand.');
  } else if (/[^\x00-\x7F]/.test(host)) {
    add('bad', 'Address contains non-English look-alike characters.');
  }

  const { domain, label, tld, subdomains } = registrable(host);

  if (!isIp) {
    if (SHORTENERS.has(host) || SHORTENERS.has(domain)) {
      add('warn', 'Link shortener or redirect service. The real destination is hidden until you open it.');
    }
    if (RISKY_TLDS.has(tld)) add('warn', `".${tld}" is a domain ending often used in scams.`);
    if (subdomains >= 3) add('warn', 'Unusually many sub-domains, a common trick to hide the real site.');
    if (!label.startsWith('xn--') && (label.match(/-/g) ?? []).length >= 3) add('warn', 'Domain name is stuffed with hyphens.');
    if (u.port && !['80', '443'].includes(u.port)) add('warn', `Uses an unusual port (${u.port}).`);

    const cleanLabel = label.replace(/-/g, '');
    let brandHit: string | null = null;
    for (const b of BRANDS) {
      if (cleanLabel === b) break;
      if (cleanLabel.length >= 4 && Math.abs(cleanLabel.length - b.length) <= 2 && levenshtein(cleanLabel, b) <= (b.length > 6 ? 2 : 1)) {
        brandHit = b;
        break;
      }
      if (label.includes(b) && label !== b) {
        brandHit = b;
        break;
      }
      if (subdomains > 0 && host.split('.').slice(0, -2).join('.').includes(b)) {
        brandHit = b;
        break;
      }
    }
    if (brandHit) {
      add('bad', `Looks like "${brandHit}" but the real domain is ${domain}. Possible impersonation.`);
    }

    const haystack = (host + u.path).toLowerCase();
    const baits = BAIT_WORDS.filter((w) => haystack.includes(w));
    if (baits.length && !brandHit) {
      add('warn', `Contains pressure words (${baits.slice(0, 3).join(', ')}) often used in phishing.`);
    }
  }

  if (RISKY_FILES.test(u.path + u.query)) add('bad', 'Leads straight to an installer or script download.');
  if (rawUrl.length > 200) add('warn', 'Very long address, which can hide where it really goes.');
  if (/%[0-9a-f]{2}/i.test(host)) add('warn', 'Encoded characters inside the domain name.');

  let verdict: Verdict = 'safe';
  if (bad > 0 || warn >= 3) verdict = 'danger';
  else if (warn > 0) verdict = 'caution';

  if (verdict === 'safe') {
    findings.push({ level: 'ok', text: 'No red flags found in the address.' });
    if (u.scheme === 'https') findings.push({ level: 'ok', text: 'Uses an encrypted connection (https).' });
    findings.push({
      level: 'info',
      text: 'Checked on this device only. It can not see what the page itself does after it loads.',
    });
  }

  const headline =
    verdict === 'danger'
      ? 'Do not open this link'
      : verdict === 'caution'
        ? 'Open with care'
        : 'No red flags found';

  actions.push({
    kind: 'open',
    label: verdict === 'danger' ? 'Open anyway' : 'Open link',
    value: rawUrl,
    primary: verdict !== 'danger',
  });
  actions.push({ kind: 'copy', label: 'Copy', value: rawUrl });
  actions.push({ kind: 'share', label: 'Share', value: rawUrl });

  return {
    kind: 'url',
    verdict,
    title: 'Website link',
    headline,
    findings,
    fields: [
      { label: 'Opens', value: host + (u.port ? ':' + u.port : '') },
      ...(u.path && u.path !== '/' ? [{ label: 'Page', value: decodeSafe(u.path) }] : []),
    ],
    actions,
  };
}

function decodeSafe(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function parseQuery(q: string): Record<string, string> {
  const out: Record<string, string> = {};
  q.replace(/^\?/, '')
    .split('&')
    .forEach((kv) => {
      if (!kv) return;
      const i = kv.indexOf('=');
      const k = i < 0 ? kv : kv.slice(0, i);
      const v = i < 0 ? '' : kv.slice(i + 1);
      out[decodeSafe(k.replace(/\+/g, ' '))] = decodeSafe(v.replace(/\+/g, ' '));
    });
  return out;
}

function analyzeUpi(raw: string): Analysis {
  const qi = raw.indexOf('?');
  const p = parseQuery(qi < 0 ? '' : raw.slice(qi));
  const findings: Finding[] = [];
  const fields: Field[] = [];
  if (p.pn) fields.push({ label: 'Payee name', value: p.pn });
  if (p.pa) fields.push({ label: 'UPI ID', value: p.pa });
  if (p.am) fields.push({ label: 'Amount', value: `${p.cu ?? 'INR'} ${p.am}` });
  if (p.tn) fields.push({ label: 'Note', value: p.tn });
  let verdict: Verdict = 'info';
  if (!p.pa) {
    verdict = 'caution';
    findings.push({ level: 'warn', text: 'No payee UPI ID found in this code.' });
  }
  if (p.am) {
    verdict = 'caution';
    findings.push({ level: 'warn', text: `Amount is pre-filled (${p.cu ?? 'INR'} ${p.am}). Check it before you pay.` });
  }
  if (p.pa && !/^[\w.\-]{2,}@[a-z]{2,}$/i.test(p.pa)) {
    verdict = 'caution';
    findings.push({ level: 'warn', text: 'The UPI ID does not look like a valid address.' });
  }
  findings.push({
    level: 'info',
    text: 'Scanning a code is only for paying. You never scan a code or enter your PIN to receive money.',
  });
  return {
    kind: 'upi',
    verdict,
    title: 'UPI payment',
    headline: verdict === 'caution' ? 'Check before you pay' : 'Payment request',
    findings,
    fields,
    actions: [
      { kind: 'open', label: 'Pay in UPI app', value: raw, primary: true },
      { kind: 'copy', label: 'Copy UPI ID', value: p.pa ?? raw },
    ],
  };
}

function unescapeWifi(s: string) {
  return s.replace(/\\([\\;,:"])/g, '$1');
}

function analyzeWifi(raw: string): Analysis {
  const body = raw.slice(5);
  const parts: string[] = [];
  let cur = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '\\' && i + 1 < body.length) {
      cur += c + body[++i];
    } else if (c === ';') {
      parts.push(cur);
      cur = '';
    } else cur += c;
  }
  if (cur) parts.push(cur);
  const map: Record<string, string> = {};
  for (const part of parts) {
    const i = part.indexOf(':');
    if (i > 0) map[part.slice(0, i).toUpperCase()] = unescapeWifi(part.slice(i + 1));
  }
  const sec = (map.T ?? 'nopass').toUpperCase();
  const findings: Finding[] = [];
  let verdict: Verdict = 'info';
  if (sec === 'NOPASS' || sec === '') {
    verdict = 'caution';
    findings.push({ level: 'warn', text: 'Open network with no password. Others on it may see your traffic.' });
  } else if (sec === 'WEP') {
    verdict = 'caution';
    findings.push({ level: 'warn', text: 'Uses outdated WEP security, which is easy to break.' });
  } else {
    findings.push({ level: 'ok', text: `Protected with ${sec}.` });
  }
  findings.push({ level: 'info', text: 'Make sure the network name matches the place you are in.' });
  return {
    kind: 'wifi',
    verdict,
    title: 'Wi-Fi network',
    headline: map.S ? `Join "${map.S}"?` : 'Wi-Fi details',
    findings,
    fields: [
      { label: 'Network', value: map.S ?? '' },
      ...(map.P ? [{ label: 'Password', value: map.P, secret: true }] : []),
      { label: 'Security', value: sec === 'NOPASS' ? 'None' : sec },
      ...(map.H === 'true' ? [{ label: 'Hidden', value: 'Yes' }] : []),
    ],
    actions: [
      ...(map.P ? [{ kind: 'copy' as const, label: 'Copy password', value: map.P, primary: true }] : []),
      { kind: 'copy', label: 'Copy network name', value: map.S ?? '' },
    ],
  };
}

function vcardField(raw: string, key: string) {
  const m = raw.match(new RegExp(`^${key}[^:\\n]*:(.+)$`, 'mi'));
  return m ? m[1].trim() : undefined;
}

export function analyze(raw: string): Analysis {
  const s = raw.trim();
  const lower = s.toLowerCase();

  if (/^upi:\/\//i.test(s)) return analyzeUpi(s);
  if (/^wifi:/i.test(s)) return analyzeWifi(s);

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) && !/^https?:\/\//i.test(s)) {
    // other URI schemes (intent://, javascript:, file:// ...) go through the URL checks
    return analyzeUrl(s, raw);
  }
  if (/^(javascript|data|vbscript):/i.test(s)) {
    return {
      kind: 'url',
      verdict: 'danger',
      title: 'Script',
      headline: 'Do not open this',
      findings: [{ level: 'bad', text: `Runs code ("${lower.split(':')[0]}:") instead of opening a page.` }],
      fields: [{ label: 'Content', value: s.slice(0, 300) }],
      actions: [{ kind: 'copy', label: 'Copy', value: s }],
    };
  }

  const url = looksLikeUrl(s);
  if (url) return analyzeUrl(url, raw);

  if (lower.startsWith('mailto:')) {
    const [addr, q = ''] = s.slice(7).split('?');
    const p = parseQuery('?' + q);
    return {
      kind: 'email',
      verdict: 'info',
      title: 'Email',
      headline: 'New email',
      findings: [{ level: 'info', text: 'Nothing is sent until you press send in your mail app.' }],
      fields: [
        { label: 'To', value: decodeSafe(addr) },
        ...(p.subject ? [{ label: 'Subject', value: p.subject }] : []),
        ...(p.body ? [{ label: 'Message', value: p.body }] : []),
      ],
      actions: [
        { kind: 'mail', label: 'Compose', value: s, primary: true },
        { kind: 'copy', label: 'Copy address', value: decodeSafe(addr) },
      ],
    };
  }

  if (lower.startsWith('tel:')) {
    const n = s.slice(4);
    return {
      kind: 'phone',
      verdict: 'info',
      title: 'Phone number',
      headline: n,
      findings: [{ level: 'info', text: 'Calls only start when you tap Call.' }],
      fields: [{ label: 'Number', value: n }],
      actions: [
        { kind: 'call', label: 'Call', value: s, primary: true },
        { kind: 'copy', label: 'Copy', value: n },
      ],
    };
  }

  if (/^smsto?:/i.test(s)) {
    const rest = s.replace(/^smsto?:/i, '');
    const i = rest.indexOf(':');
    const num = i < 0 ? rest.split('?')[0] : rest.slice(0, i);
    const msg = i < 0 ? '' : rest.slice(i + 1);
    return {
      kind: 'sms',
      verdict: 'info',
      title: 'Text message',
      headline: `Message to ${num}`,
      findings: [{ level: 'info', text: 'Premium-rate numbers can charge you. Check the number first.' }],
      fields: [
        { label: 'To', value: num },
        ...(msg ? [{ label: 'Message', value: msg }] : []),
      ],
      actions: [
        { kind: 'sms', label: 'Open Messages', value: `sms:${num}${msg ? `&body=${encodeURIComponent(msg)}` : ''}`, primary: true },
        { kind: 'copy', label: 'Copy number', value: num },
      ],
    };
  }

  if (lower.startsWith('geo:')) {
    const c = s.slice(4).split('?')[0];
    return {
      kind: 'geo',
      verdict: 'info',
      title: 'Location',
      headline: c,
      findings: [],
      fields: [{ label: 'Coordinates', value: c }],
      actions: [
        { kind: 'map', label: 'Open in Maps', value: `https://maps.apple.com/?ll=${c}`, primary: true },
        { kind: 'copy', label: 'Copy', value: c },
      ],
    };
  }

  if (/^BEGIN:VCARD/i.test(s)) {
    const name = vcardField(s, 'FN') ?? vcardField(s, 'N')?.replace(/;/g, ' ').trim();
    const tel = vcardField(s, 'TEL');
    const mail = vcardField(s, 'EMAIL');
    const org = vcardField(s, 'ORG');
    return {
      kind: 'contact',
      verdict: 'info',
      title: 'Contact card',
      headline: name ?? 'Contact',
      findings: [{ level: 'info', text: 'Review the details before saving to your contacts.' }],
      fields: [
        ...(name ? [{ label: 'Name', value: name }] : []),
        ...(org ? [{ label: 'Company', value: org }] : []),
        ...(tel ? [{ label: 'Phone', value: tel }] : []),
        ...(mail ? [{ label: 'Email', value: mail }] : []),
      ],
      actions: [
        ...(tel ? [{ kind: 'call' as const, label: 'Call', value: `tel:${tel}`, primary: true }] : []),
        ...(mail ? [{ kind: 'mail' as const, label: 'Email', value: `mailto:${mail}` }] : []),
        { kind: 'copy', label: 'Copy card', value: s },
      ],
    };
  }

  if (/^BEGIN:VEVENT|^BEGIN:VCALENDAR/i.test(s)) {
    const title = vcardField(s, 'SUMMARY');
    const start = vcardField(s, 'DTSTART');
    const loc = vcardField(s, 'LOCATION');
    return {
      kind: 'event',
      verdict: 'info',
      title: 'Calendar event',
      headline: title ?? 'Event',
      findings: [],
      fields: [
        ...(title ? [{ label: 'Title', value: title }] : []),
        ...(start ? [{ label: 'Starts', value: start }] : []),
        ...(loc ? [{ label: 'Where', value: loc }] : []),
      ],
      actions: [{ kind: 'copy', label: 'Copy', value: s, primary: true }],
    };
  }

  if (/^\d{8}$|^\d{12,14}$/.test(s)) {
    return {
      kind: 'product',
      verdict: 'info',
      title: 'Product barcode',
      headline: s,
      findings: [{ level: 'info', text: 'Product codes only identify an item. They do not open anything by themselves.' }],
      fields: [{ label: 'Code', value: s }],
      actions: [
        { kind: 'search', label: 'Look up product', value: `https://www.google.com/search?q=${s}`, primary: true },
        { kind: 'copy', label: 'Copy', value: s },
      ],
    };
  }

  return {
    kind: 'text',
    verdict: 'info',
    title: 'Text',
    headline: s.length > 60 ? s.slice(0, 57) + '...' : s,
    findings: [],
    fields: [],
    actions: [
      { kind: 'copy', label: 'Copy', value: s, primary: true },
      { kind: 'share', label: 'Share', value: s },
      { kind: 'search', label: 'Search web', value: `https://www.google.com/search?q=${encodeURIComponent(s)}` },
    ],
  };
}
