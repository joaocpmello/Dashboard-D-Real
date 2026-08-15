# ADR-0003 — Criptografia de segredos iFood em repouso

**Status:** Aceito • **Data:** 2026-08-15

## Contexto

`client_secret`, `access_token` e `refresh_token` do iFood são **secrets**. Vazamento de banco expõe credenciais de integração.

## Decisão

Criptografia em repouso via **AES-256-GCM** com chave em variável de ambiente (`CREDENTIAL_ENCRYPTION_KEY`). Implementado como helper puro em `src/lib/crypto/secrets.ts`:

- `encryptSecret(plain): string` → armazenar;
- `decryptSecret(cipher): string` → usar no servidor;
- `client_secret`, `access_token`, `refresh_token` armazenados **criptografados**;
- Em uso, decriptografa apenas no momento da chamada, em memória, e nunca loga.

## Consequências

- Vazamento do banco não expõe segredos sem a chave;
- Chave precisa ser rotacionada → `key_version` armazenado junto com o ciphertext;
- Custo: zero em runtime (AES é barato).

## Alternativas

- **Hashing**: rejeitado — tokens precisam ser decriptografados pra uso;
- **Vault externo (HashiCorp, AWS KMS)**: overkill pra MVP; podemos plugar depois.
