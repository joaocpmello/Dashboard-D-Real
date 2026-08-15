# ADR-0002 — Ambientes iFood: credenciais separadas, host único

**Status:** Aceito • **Data:** 2026-08-15

## Contexto

A documentação oficial do iFood (`https://developer.ifood.com.br`) **não publica hosts separados** para sandbox/homologação e produção. Toda chamada de exemplo aponta para `https://merchant-api.ifood.com.br`. A separação de ambientes é feita no **portal do developer** com credenciais (`clientId`/`clientSecret`) distintas por app/ambiente.

## Decisão

Manter **uma única base URL** (`https://merchant-api.ifood.com.br`) e armazenar **duas coleções de credenciais por Organization**:

```
ifood_credentials
├── organization_id
├── environment       # 'sandbox' | 'production'
├── client_id
├── client_secret     (encrypted at rest — ver ADR-0003)
└── access_token_cache
    ├── token
    ├── expires_at
```

O app seleciona qual coleção usar via `process.env.IFOOD_ENVIRONMENT` (default `sandbox`).

## Consequências

- Quando o iFood publicar host de sandbox distinto (se publicar), ajustamos `IfoodClient` para resolver `baseUrl` por ambiente — mudança isolada;
- Risco reduzido: sem URL "inventada";
- Devs e consultores podem alternar ambientes sem trocar host.

## Alternativas consideradas

- **Hardcode `sandbox.ifood-api.com.br`**: rejeitado — não confirmado oficialmente;
- **Variáveis de ambiente por ambiente**: rejeitado — quebra multi-tenant (várias Orgs no mesmo deploy compartilhariam credenciais).
