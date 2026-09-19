import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import { EncryptionService } from '../src/common/crypto/encryption.service.js';

function createService(key = 'test-master-key-for-encryption!!') {
  const config = {
    get: (name: string) => (name === 'MASTER_ENCRYPTION_KEY' ? key : undefined),
  } as ConfigService;
  return new EncryptionService(config);
}

describe('EncryptionService (AES-256-GCM)', () => {
  it('chiffre et déchiffre un secret OAuth Tailscale', () => {
    const service = createService();
    const secret = 'tskey-client-secret-example-value';

    const encrypted = service.encrypt(secret);

    expect(encrypted).not.toContain(secret);
    expect(service.decrypt(encrypted)).toBe(secret);
  });

  it('produit un ciphertext différent à chaque appel (IV aléatoire)', () => {
    const service = createService();
    const a = service.encrypt('same-value');
    const b = service.encrypt('same-value');
    expect(a).not.toBe(b);
    expect(service.decrypt(a)).toBe('same-value');
    expect(service.decrypt(b)).toBe('same-value');
  });

  it('rejette la modification du ciphertext', () => {
    const service = createService();
    const encrypted = service.encrypt('tailscale-secret');
    const buffer = Buffer.from(encrypted, 'base64');
    buffer[buffer.length - 1] ^= 0xff;

    expect(() => service.decrypt(buffer.toString('base64'))).toThrow();
  });
});
