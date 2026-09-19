import { describe, expect, it } from 'vitest';
import {
  generatePairingCode,
  hashPairingCode,
  normalizePairingCode,
} from '../src/pairing/pairing.utils.js';

describe('pairing utils', () => {
  it('generates a code in XXXX-XXXX format', () => {
    const code = generatePairingCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it('normalizes pairing codes', () => {
    expect(normalizePairingCode(' 8f3k-9d2m ')).toBe('8F3K-9D2M');
  });

  it('hashes pairing codes deterministically', () => {
    const hashA = hashPairingCode('8F3K-9D2M');
    const hashB = hashPairingCode('8f3k-9d2m');
    expect(hashA).toBe(hashB);
  });
});
