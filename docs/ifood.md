# Integração iFood

> Última atualização: FASE 0. Implementação em `src/lib/ifood/`.

## Fontes oficiais

- Portal developer: https://developer.ifood.com.br/
- Authentication: https://developer.ifood.com.br/pt-BR/docs/guides/modules/authentication/intro
- Merchant endpoints: https://developer.ifood.com.br/pt-BR/docs/guides/modules/merchant/endpoints
- Workflow merchant: https://developer.ifood.com.br/pt-BR/docs/guides/modules/merchant/workflow

> Sempre que houver dúvida sobre um endpoint, **voltar para a doc oficial**. Não confiar em blogs.

## Fluxo OAuth 2.0 (`client_credentials`)

Apps centralizadas (consultoria) usam `client_credentials` — não há usuário final iFood no fluxo.

```
1. Backend da consultoria inicia fluxo:
   POST https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token
   Content-Type: application/x-www-form-urlencoded

   grantType=client_credentials
   &clientId=<IFOOD_CLIENT_ID>
   &clientSecret=<IFOOD_CLIENT_SECRET>

2. Resposta 200:
   {
     "accessToken": "<jwt>",
     "type": "bearer",
     "expiresIn": 21600    // 6h
   }

3. Chamadas subsequentes:
   GET https://merchant-api.ifood.com.br/merchant/v1.0/merchants
   Authorization: Bearer <accessToken>
```

## Endpoints usados no MVP

| Método | Path | Uso |
|---|---|---|
| `POST` | `/authentication/v1.0/oauth/token` | Obter/renovar token |
| `GET` | `/merchant/v1.0/merchants?page=&size=` | Listar merchants |
| `GET` | `/merchant/v1.0/merchants/{id}` | Detalhe |
| `GET` | `/merchant/v1.0/merchants/{id}/status` | Status |

> Outros endpoints (interruptions, opening-hours, etc.) só serão adicionados quando uma feature exigir. **Não antecipar.**

## Camadas

```
src/lib/ifood/
├── client.ts          # IfoodClient: HTTP client com auth, timeout, retries, logs seguros
├── auth.ts            # IfoodAuthService: getAccessToken(organizationId), cache + refresh
├── merchant.ts        # IfoodMerchantService: listMerchants, getMerchant, getStatus
├── types/
│   ├── token.ts
│   ├── merchant.ts
│   └── common.ts
└── errors.ts          # IfoodError + IfoodAuthError
```

### `IfoodClient`

Responsabilidades:
- Resolver base URL (constante única por enquanto — ADR-0002);
- Injetar `Authorization: Bearer <token>`;
- Timeout configurável;
- Tratar HTTP status (401 → reautentica; 429 → backoff exponencial; 5xx → retry limitado);
- Logs **sem** tokens/secrets.

### `IfoodAuthService.getAccessToken(organizationId)`

```ts
async function getAccessToken(orgId: string): Promise<string> {
  const cached = readCache(orgId, currentEnvironment());
  if (cached && cached.expiresAt > now() + SAFETY_MARGIN) return cached.token;

  const creds = await credentialsRepo.getDecrypted(orgId, currentEnvironment());
  const res = await fetchToken(creds.clientId, creds.clientSecret);
  await credentialsRepo.saveToken(orgId, res.accessToken, res.expiresIn);
  return res.accessToken;
}
```

Cache por organização + ambiente, em memória **dentro do processo do servidor**. Não persistir token plaintext — ao reiniciar o processo, refetch.

## Ambientes

Ver `ADR-0002-ifood-environments.md`. Resumo: **uma URL base**, **duas credenciais por Organization** (`sandbox`, `production`), seleção via `process.env.IFOOD_ENVIRONMENT`.

## Limites & resiliência

- Rate limit documentado: 1000 req/s em todos endpoints (alto);
- Polling mínimo recomendado: 30s por loja;
- **Backoff exponencial** em 429;
- Em 401: refresh token e refazer a request **uma vez**;
- Nunca logar `Authorization` header.

## Erros

`IfoodError` com `{ status, code, message }`. Nunca enviar detalhes do iFood ao cliente — apenas mensagem genérica ("Falha ao consultar iFood").
