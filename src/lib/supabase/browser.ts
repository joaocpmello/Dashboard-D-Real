import { createBrowserClient } from '@supabase/ssr';

// Cliente Supabase para uso em Client Components.
// Não usar para operações sensíveis — qualquer checagem de autorização
// precisa acontecer no servidor.

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
