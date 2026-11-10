import JsBarcode from 'jsbarcode';

export type QrType = 'url' | 'text' | 'wifi' | 'contact' | 'email' | 'phone' | 'sms' | 'upi';
export type BarFormat = 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14';

export const QR_TYPES: { id: QrType; label: string; icon: string }[] = [
  { id: 'url', label: 'Link', icon: 'link' },
  { id: 'text', label: 'Text', icon: 'text' },
  { id: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  { id: 'contact', label: 'Contact', icon: 'person' },
  { id: 'email', label: 'Email', icon: 'mail' },
  { id: 'phone', label: 'Phone', icon: 'call' },
  { id: 'sms', label: 'SMS', icon: 'chatbubble' },
  { id: 'upi', label: 'UPI', icon: 'wallet' },
];

export const BAR_FORMATS: { id: BarFormat; label: string; hint: string }[] = [
  { id: 'CODE128', label: 'Code 128', hint: 'Any text or numbers' },
  { id: 'EAN13', label: 'EAN-13', hint: '12 or 13 digits' },
  { id: 'EAN8', label: 'EAN-8', hint: '7 or 8 digits' },
  { id: 'UPC', label: 'UPC-A', hint: '11 or 12 digits' },
  { id: 'CODE39', label: 'Code 39', hint: 'A-Z, 0-9, - . $ / + %' },
  { id: 'ITF14', label: 'ITF-14', hint: '13 or 14 digits' },
];

export type Fields = Record<string, string>;

const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');

export function buildPayload(type: QrType, f: Fields): string {
  const v = (k: string) => (f[k] ?? '').trim();
  switch (type) {
    case 'url': {
      const u = v('url');
      if (!u) return '';
      return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `https://${u}`;
    }
    case 'text':
      return f.text ?? '';
    case 'wifi': {
      if (!v('ssid')) return '';
      const sec = f.security ?? 'WPA';
      const pass = sec === 'nopass' ? '' : `P:${esc(f.password ?? '')};`;
      return `WIFI:T:${sec};S:${esc(v('ssid'))};${pass}${f.hidden === 'true' ? 'H:true;' : ''};`;
    }
    case 'contact': {
      if (!v('name') && !v('phone') && !v('email')) return '';
      const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${v('name')}`, `N:${v('name')};;;;`];
      if (v('org')) lines.push(`ORG:${v('org')}`);
      if (v('phone')) lines.push(`TEL;TYPE=CELL:${v('phone')}`);
      if (v('email')) lines.push(`EMAIL:${v('email')}`);
      if (v('site')) lines.push(`URL:${v('site')}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }
    case 'email': {
      if (!v('to')) return '';
      const q = [
        v('subject') && `subject=${encodeURIComponent(v('subject'))}`,
        v('body') && `body=${encodeURIComponent(v('body'))}`,
      ].filter(Boolean);
      return `mailto:${v('to')}${q.length ? '?' + q.join('&') : ''}`;
    }
    case 'phone':
      return v('phone') ? `tel:${v('phone').replace(/\s/g, '')}` : '';
    case 'sms':
      return v('phone') ? `SMSTO:${v('phone').replace(/\s/g, '')}:${f.message ?? ''}` : '';
    case 'upi': {
      if (!v('pa')) return '';
      const q = [`pa=${encodeURIComponent(v('pa'))}`];
      if (v('pn')) q.push(`pn=${encodeURIComponent(v('pn'))}`);
      if (v('am')) q.push(`am=${encodeURIComponent(v('am'))}`);
      q.push('cu=INR');
      if (v('tn')) q.push(`tn=${encodeURIComponent(v('tn'))}`);
      return `upi://pay?${q.join('&')}`;
    }
  }
}

/** Returns the bar pattern ("1010...") for a 1D barcode, or an error message. */
export function encodeBarcode(
  text: string,
  format: BarFormat,
): { ok: true; bits: string; label: string } | { ok: false; error: string } {
  if (!text) return { ok: false, error: 'Enter a value to see the barcode.' };
  let valid = true;
  const out: { encodings?: { data: string; text?: string }[] } = {};
  try {
    JsBarcode(out, text, { format, flat: true, valid: (v: boolean) => (valid = v) });
  } catch {
    valid = false;
  }
  if (!valid || !out.encodings?.length) {
    const hint = BAR_FORMATS.find((b) => b.id === format)?.hint ?? '';
    return { ok: false, error: `Not valid for this format. ${hint}.` };
  }
  return {
    ok: true,
    bits: out.encodings.map((e) => e.data).join(''),
    label: out.encodings[0].text ?? text,
  };
}
