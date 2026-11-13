// Writes the QR images seeded into the simulator photo library for the scan step.
import QRCode from 'qrcode';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'qa/fixtures';
mkdirSync(out, { recursive: true });
const codes = [['01-safe-link.png', 'https://example.com/scanwise-qa']];
for (const [name, value] of codes) {
  await QRCode.toFile(join(out, name), value, { width: 900, margin: 4, errorCorrectionLevel: 'M' });
  console.log(`qr fixture: ${name} -> ${value}`);
}
