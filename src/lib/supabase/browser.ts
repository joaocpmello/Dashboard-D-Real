import { createBrowserClient } from '@supabase/ssr';

// Cliente Supabase para uso em Client Components.
// Não usar para operações sensíveis — qualquer checagem de autorização
// precisa acontecer no servidor.
//
// NB: as variáveis NEXT_PUBLIC_* são embutidas no bundle pelo Next no build.
// Aqui apenas lemos do `process.env` (resolvido em build-time pelo Next).

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      '[supabase/browser] NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias.',
    );
  }
  return createBrowserClient(url, anon);
}
