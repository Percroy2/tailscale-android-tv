import { createHash, randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePairingCode(): string {
  const part = () =>
    Array.from({ length: 4 }, () =>
      ALPHABET[randomBytes(1)[0] % ALPHABET.length],
    ).join('');
  return `${part()}-${part()}`;
}

export function hashPairingCode(code: string): string {
  return createHash('sha256').update(code.toUpperCase()).digest('hex');
}

export function normalizePairingCode(code: string): string {
  return code.trim().toUpperCase();
}
