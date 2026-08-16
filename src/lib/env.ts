import 'server-only';

// Validação centralizada das variáveis de ambiente SERVER-SIDE.
// Falha cedo e de forma clara se algo essencial estiver faltando.
//
// Observação:
//   - Variáveis NEXT_PUBLIC_* são embutidas no bundle do cliente pelo Next
//     durante o build, e a presença delas é checada via TypeScript/build.
//   - Aqui validamos apenas o que é lido em runtime no servidor (segredos e
//     URLs do Supabase / DB). Se algo faltar, abortamos com mensagem útil
//     em vez de um `undefined` críptico mais tarde.

type Vars = {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
  DIRECT_URL: string;
  CREDENTIAL_ENCRYPTION_KEY: string;
};

let cached: Vars | null = null;

export function getServerEnv(): Vars {
  if (cached) return cached;

  const required: (keyof Vars)[] = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'DIRECT_URL',
    'CREDENTIAL_ENCRYPTION_KEY',
  ];

  const missing: string[] = [];
  const out = {} as Record<keyof Vars, string>;
  for (const k of required) {
    const v = process.env[k];
    if (!v || v.trim() === '') missing.push(k);
    else out[k] = v;
  }
  if (missing.length > 0) {
    throw new Error(
      `[env] Variáveis de ambiente ausentes ou vazias: ${missing.join(', ')}.\n` +
        'Preencha .env.local (ou as variáveis no painel da Vercel) antes de subir o servidor.',
    );
  }
  cached = out as Vars;
  return cached;
}

// Reseta cache — usado em testes para reavaliar o ambiente.
export function __resetServerEnvForTests(): void {
  cached = null;
}
