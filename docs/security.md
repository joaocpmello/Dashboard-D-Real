# Segurança — Princípios e Auditoria

> Última atualização: FASE 0. Auditoria ativa na FASE 4.

## Princípios inegociáveis

1. **Server-side é a única fonte de verdade.** Frontend nunca confiável.
2. **Secrets nunca saem do servidor.** Nem em código, nem em log, nem em response.
3. **Defesa em profundidade** — autorização + filtros + RLS + testes.
4. **Falhar fechado.** Sem policy → negar.

## Regras de handling de secrets

| Item | Onde pode aparecer | Onde NÃO pode |
|---|---|---|
| `IFOOD_CLIENT_SECRET` | `.env` (local) + vars Vercel | código, logs, response, `NEXT_PUBLIC_*` |
| `access_token` iFood | memória do processo | log, response, banco plaintext |
| `refresh_token` iFood | memória do processo | log, response |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | `NEXT_PUBLIC_*` |
| Senha de usuário | Supabase Auth | nunca no nosso banco |

## Auditoria por fase

- **FASE 1:** Auth, RBAC, RLS, organização → usuário;
- **FASE 2:** Fluxo de credenciais iFood, criptografia em repouso, headers HTTP;
- **FASE 3:** Inputs do frontend, validação Zod, renderização;
- **FASE 4:** Sweep completo — grep por `NEXT_PUBLIC_`, `console.log`, `client_secret`, `access_token` em código-fonte; revisão de handlers sem authz.

## Checklist de auditoria (template)

- [ ] Nenhum secret em `NEXT_PUBLIC_*`;
- [ ] Nenhum `console.log` em produção com payload sensível;
- [ ] Toda rota autenticada checa sessão + RBAC;
- [ ] Toda query filtra por `organization_id` (exceto `SUPER_ADMIN`);
- [ ] RLS ativo em tabelas multi-tenant;
- [ ] `IfoodAuthService` nunca loga token;
- [ ] Erros de iFood retornam mensagem genérica ao cliente;
- [ ] Headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`;
- [ ] Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`.
