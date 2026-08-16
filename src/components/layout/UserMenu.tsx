'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Props = {
  email: string;
  fullName: string | null;
  roleLabel: string;
};

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '';
    const b = parts[parts.length - 1]?.[0] ?? '';
    return (a + b).toUpperCase().slice(0, 2) || 'U';
  }
  return (email[0] ?? 'U').toUpperCase();
}

export function UserMenu({ email, fullName, roleLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // mesmo se falhar, redireciona — middleware vai limpar o cookie na próxima ida.
    } finally {
      setBusy(false);
      window.location.href = '/login';
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-800 hover:bg-ink-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          {initials(fullName, email)}
        </span>
        <span className="hidden text-left md:block">
          <span className="block max-w-[140px] truncate text-sm font-medium leading-tight">
            {fullName ?? email}
          </span>
          <span className="block text-[11px] text-ink-500">{roleLabel}</span>
        </span>
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-ink-400">
          <path d="M5.5 7.5 10 12l4.5-4.5z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-card"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="border-b border-ink-100 px-3 py-3">
            <p className="truncate text-sm font-medium text-ink-900">{fullName ?? email}</p>
            <p className="truncate text-xs text-ink-500">{email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/configuracoes"
              className="block px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
              onClick={() => setOpen(false)}
            >
              Configurações
            </Link>
            <button
              type="button"
              onClick={onSignOut}
              disabled={busy}
              className="block w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-50 disabled:opacity-50"
            >
              {busy ? 'Saindo…' : 'Sair'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
