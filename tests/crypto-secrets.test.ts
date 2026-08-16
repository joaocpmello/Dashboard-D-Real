/**
 * Testes do utilitário de criptografia AES-256-GCM.
 * Verifica roundtrip, IVs únicos, e rejeição de chave inválida.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';

describe('crypto/secrets (AES-256-GCM)', () => {
  beforeAll(() => {
    // Garante que existe uma chave válida (32 bytes base64).
    process.env.CREDENTIAL_ENCRYPTION_KEY ??= randomBytes(32).toString('base64');
  });

  it('faz roundtrip sem corromper o texto', async () => {
    const { encryptSecret, decryptSecret } = await import('@/lib/crypto/secrets');
    const plain = 'client_secret_super_secreto_!@#$%^&*()';
    const { cipher, keyVersion } = encryptSecret(plain);
    expect(cipher).toBeTypeOf('string');
    expect(cipher).not.toContain(plain);
    expect(decryptSecret(cipher, keyVersion)).toBe(plain);
  });

  it('gera ciphertexts diferentes para o mesmo plaintext (IVs únicos)', async () => {
    const { encryptSecret } = await import('@/lib/crypto/secrets');
    const a = encryptSecret('mesmo-segredo');
    const b = encryptSecret('mesmo-segredo');
    expect(a.cipher).not.toBe(b.cipher);
  });

  it('rejeita versão de chave desconhecida', async () => {
    const { encryptSecret, decryptSecret } = await import('@/lib/crypto/secrets');
    const { cipher } = encryptSecret('x');
    expect(() => decryptSecret(cipher, 999)).toThrow(/Versão de chave não suportada/);
  });

  it('rejeita chave base64 de tamanho incorreto', async () => {
    const { encryptSecret } = await import('@/lib/crypto/secrets');
    const original = process.env.CREDENTIAL_ENCRYPTION_KEY;
    process.env.CREDENTIAL_ENCRYPTION_KEY = Buffer.from('curta').toString('base64');
    try {
      expect(() => encryptSecret('x')).toThrow(/32 bytes/);
    } finally {
      process.env.CREDENTIAL_ENCRYPTION_KEY = original;
    }
  });
});
