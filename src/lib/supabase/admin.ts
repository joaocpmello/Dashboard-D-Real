import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';

// Cliente Supabase com service_role — SERVER ONLY.
// Tem bypass de RLS; usar APENAS em ações administrativas e no seed.
// NUNCA importar em arquivos acessíveis pelo browser.

export function createSupabaseAdminClient() {
  const env = getServerEnv();
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
