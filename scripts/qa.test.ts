import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseQaUrl } from '../src/lib/qa.ts';

describe('QA deep links', () => {
  it('parses a scan with an encoded payload', () => {
    assert.deepEqual(parseQaUrl('scanwise://qa/scan?raw=https%3A%2F%2Fexample.com%2Fx'), { kind: 'scan', raw: 'https://example.com/x' });
  });
  it('parses pro on and off', () => {
    assert.deepEqual(parseQaUrl('scanwise://qa/pro/off'), { kind: 'pro', on: false });
    assert.deepEqual(parseQaUrl('scanwise://qa/pro/on'), { kind: 'pro', on: true });
  });
  it('rejects anything else', () => {
    for (const u of ['scanwise://qa/scan', 'scanwise://qa/pro', 'scanwise://qa/rm', 'https://qa/scan?raw=x', '', null]) assert.equal(parseQaUrl(u), null);
  });
});
