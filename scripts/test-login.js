/* eslint-disable */
// Smoke-test E2E real do fluxo /login contra Supabase.
//
// Estratégia:
//  1) Localiza o super-admin em auth.users via service_role.
//  2) Salva um HASH temporário da senha atual (não conseguimos ler a senha em claro
//     — Supabase guarda apenas o bcrypt hash — então geramos uma senha TEMPORÁRIA,
//     sobrescrevemos a senha real, e DEPOIS restauramos o hash original).
//  3) Faz signInWithPassword com a senha temporária (mesmo caminho que o browser faz).
//  4) Reverte a senha para o hash original.
//
// Assim, o teste prova que o fluxo inteiro funciona SEM alterar permanentemente
// a senha do super-admin.
//
// Pré-requisito: .env.local com NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY, INITIAL_SUPER_ADMIN_EMAIL.

const fs = require('fs');
const path = require('path');

// Carrega .env.local sem dependência de dotenv
const envPath = path.join(__dirname, '..', '.env.local');
const txt = fs.readFileSync(envPath, 'utf8');
for (const line of txt.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  if (!(key in process.env)) process.env[key] = val;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.INITIAL_SUPER_ADMIN_EMAIL || '').trim().toLowerCase();

if (!url || !anon || !service || !email) {
  console.error('Faltam env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, INITIAL_SUPER_ADMIN_EMAIL');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

const TEMP_PASSWORD = 'TempLogin!E2E_' + Date.now();

(async () => {
  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Localiza o usuário
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error('listUsers failed: ' + listErr.message);
  const u = list.users.find((x) => (x.email || '').toLowerCase() === email);
  if (!u) throw new Error(`user ${email} not found in auth.users`);
  console.log('✓ auth.users row:');
  console.log('  id                =', u.id);
  console.log('  email             =', u.email);
  console.log('  email_confirmed_at=', u.email_confirmed_at);
  console.log('  providers         =', (u.app_metadata?.providers || []).join(','));

  // 2) Salva o hash original (para reverter depois) e seta senha temporária
  //    Nota: o admin API não expõe o hash diretamente — usamos updateUserById que
  //    substitui a senha. Para "salvar" a senha original teríamos que pedir ao
  //    usuário; aqui usamos uma flag de aviso: se TEMP_PASSWORD_FAIL_ON_RESTORE=1
  //    e o login falhar, abortamos SEM restaurar (sinaliza que a senha real mudou).
  //
  //    Estratégia mais segura: NÃO mexemos na senha do super-admin.
  //    Em vez disso, criamos um usuário descartável TEMP_USER_PREFIX e testamos com ele.
  //    Se já existir um com esse prefixo, reusa. Esse usuário é deletado no final.

  const tempEmail = 'e2e-login-smoke+' + Date.now() + '@deliveryreal.com';
  console.log('\n→ criando usuário descartável para o smoke test:', tempEmail);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: tempEmail,
    password: TEMP_PASSWORD,
    email_confirm: true,
  });
  if (createErr) throw new Error('createUser failed: ' + createErr.message);
  const tempId = created.user.id;
  console.log('  temp user id =', tempId);

  // 3) Login real com a senha temporária (mesmo caminho do browser /login)
  const anonClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: signin, error: signinErr } = await anonClient.auth.signInWithPassword({
    email: tempEmail,
    password: TEMP_PASSWORD,
  });

  let ok = false;
  if (signinErr) {
    console.log('\n✗ signInWithPassword FAILED:', signinErr.message, '(status:', signinErr.status + ')');
  } else {
    ok = true;
    console.log('\n✓ signInWithPassword SUCCESS');
    console.log('  user.id           =', signin.user.id);
    console.log('  user.email        =', signin.user.email);
    console.log('  has access_token  =', !!signin.session?.access_token);
    console.log('  has refresh_token =', !!signin.session?.refresh_token);
    console.log('  expires_at        =', signin.session?.expires_at);
  }

  // 4) Limpa: deleta o usuário temporário
  const { error: delErr } = await admin.auth.admin.deleteUser(tempId);
  if (delErr) {
    console.log('\n⚠ falha ao deletar usuário temporário (idempotente, ignore):', delErr.message);
  } else {
    console.log('\n✓ usuário temporário removido (idempotente)');
  }

  if (!ok) process.exit(2);
})().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
