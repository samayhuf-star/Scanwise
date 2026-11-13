import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|swift)$/.test(f) ? [p] : [];
  });
const files = [...walk(join(root, 'src')), ...walk(join(root, 'qa'))];

describe('app copy', () => {
  it('has no ellipsis characters', () => {
    for (const f of files) assert.ok(!readFileSync(f, 'utf8').includes('\u2026'), f);
  });
  it('does not mention AI', () => {
    for (const f of files) assert.doesNotMatch(readFileSync(f, 'utf8'), /\bAI\b|artificial intelligence/, f);
  });
  it('never hard-codes a price in the UI', () => {
    for (const f of walk(join(root, 'src'))) assert.doesNotMatch(readFileSync(f, 'utf8'), /\$\d+\.\d\d/, f);
  });
  it('the paywall has Close, Restore, Terms, Privacy and the renewal text', () => {
    const pw = readFileSync(join(root, 'src/app/paywall.tsx'), 'utf8');
    for (const s of ['accessibilityLabel="Close"', 'Restore purchases', 'TERMS_URL', 'PRIVACY_URL', 'renewalDisclosure', 'ctaText']) assert.ok(pw.includes(s), s);
  });
  it('Settings has its own Restore purchases entry', () => {
    assert.ok(readFileSync(join(root, 'src/app/(tabs)/settings.tsx'), 'utf8').includes('Restore purchases'));
  });
  it('the app opens on Scan, not the paywall', () => {
    const layout = readFileSync(join(root, 'src/app/_layout.tsx'), 'utf8');
    assert.doesNotMatch(layout, /paywall['"]\s*\)|initialRouteName=["']paywall/);
  });
});
