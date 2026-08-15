import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com service_role — SERVER ONLY.
// Tem bypass de RLS; usar APENAS em ações administrativas e no seed.
// NUNCA importar em arquivos acessíveis pelo browser.

export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
