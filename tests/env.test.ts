/**
 * Testes do validador central de env (server-side).
 *
 * Garante que:
 *   - Falha com mensagem útil se faltar uma var essencial.
 *   - Retorna o objeto populado quando todas estão presentes.
 *   - Cacheia o resultado entre chamadas.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const REQUIRED_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
  'CREDENTIAL_ENCRYPTION_KEY',
] as const;

function setFullEnv() {
  for (const k of REQUIRED_KEYS) {
    process.env[k] = `value-of-${k}`;
  }
}

describe('lib/env (getServerEnv)', () => {
  let originals: Record<string, string | undefined>;

  beforeEach(() => {
    originals = {};
    for (const k of REQUIRED_KEYS) {
      originals[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of REQUIRED_KEYS) {
      if (originals[k] === undefined) delete process.env[k];
      else process.env[k] = originals[k];
    }
  });

  it('lança erro listando todas as vars ausentes', async () => {
    const { getServerEnv } = await import('@/lib/env');
    expect(() => getServerEnv()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => getServerEnv()).toThrowError(/SUPABASE_SERVICE_ROLE_KEY/);
    expect(() => getServerEnv()).toThrowError(/DATABASE_URL/);
    expect(() => getServerEnv()).toThrowError(/DIRECT_URL/);
    expect(() => getServerEnv()).toThrowError(/CREDENTIAL_ENCRYPTION_KEY/);
  });

  it('detecta string vazia como ausente', async () => {
    const { __resetServerEnvForTests, getServerEnv } = await import('@/lib/env');
    __resetServerEnvForTests();
    process.env.NEXT_PUBLIC_SUPABASE_URL = '  ';
    for (const k of REQUIRED_KEYS) {
      if (k === 'NEXT_PUBLIC_SUPABASE_URL') continue;
      process.env[k] = 'x';
    }
    expect(() => getServerEnv()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('retorna o objeto populado quando todas as vars estão presentes', async () => {
    const { __resetServerEnvForTests, getServerEnv } = await import('@/lib/env');
    __resetServerEnvForTests();
    setFullEnv();
    const env = getServerEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('value-of-NEXT_PUBLIC_SUPABASE_URL');
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('value-of-SUPABASE_SERVICE_ROLE_KEY');
    expect(env.CREDENTIAL_ENCRYPTION_KEY).toBe('value-of-CREDENTIAL_ENCRYPTION_KEY');
  });

  it('cacheia o resultado entre chamadas', async () => {
    const { __resetServerEnvForTests, getServerEnv } = await import('@/lib/env');
    __resetServerEnvForTests();
    setFullEnv();
    const a = getServerEnv();
    // Alterar o env DEPOIS da primeira chamada não afeta o cache.
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'outra-coisa';
    const b = getServerEnv();
    expect(b).toBe(a);
    expect(b.NEXT_PUBLIC_SUPABASE_URL).toBe('value-of-NEXT_PUBLIC_SUPABASE_URL');
  });
});
