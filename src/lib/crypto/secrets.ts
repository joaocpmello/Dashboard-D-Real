import 'server-only';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type CipherGCMTypes,
} from 'node:crypto';

// Cifra AES-256-GCM. Formato de saída:
//   base64( iv(12 bytes) || authTag(16 bytes) || ciphertext )
//
// Validação:
//   - Esta camada valida APENAS a sua própria chave (CREDENTIAL_ENCRYPTION_KEY),
//     para ser usável em testes unitários sem montar o ambiente inteiro.
//   - A validação central do ambiente (Supabase/DB) é feita em `lib/env.ts`
//     quando um cliente Supabase é instanciado.

const ALGO: CipherGCMTypes = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_VERSION = 1;

function loadKey(): Buffer {
  const raw = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY não definida');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY deve ter 32 bytes (base64)');
  }
  return key;
}

export function encryptSecret(plain: string): { cipher: string; keyVersion: number } {
  const key = loadKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, tag, ct]).toString('base64');
  return { cipher: blob, keyVersion: KEY_VERSION };
}

export function decryptSecret(blob: string, keyVersion: number): string {
  if (keyVersion !== KEY_VERSION) {
    // Por ora, MVP não suporta múltiplas versões. Implementar rotação depois.
    throw new Error(`Versão de chave não suportada: ${keyVersion}`);
  }
  const key = loadKey();
  const buf = Buffer.from(blob, 'base64');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}
