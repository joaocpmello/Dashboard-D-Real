'use client';

import { useMemo, useState } from 'react';
import { Table, TBody, TD, TH, THead, TR, TableEmpty } from '@/components/ui/Table';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { Badge, Dot } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import type { UserSummary } from '@/lib/data/types';

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} dia${days > 1 ? 's' : ''}`;
}

export function UsersTable({
  rows,
  canManage,
}: {
  rows: UserSummary[];
  canManage: boolean;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.fullName ?? '').toLowerCase().includes(q),
    );
  }, [rows, query]);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Nenhum usuário cadastrado"
        description="Convide membros para sua equipe para que eles acessem o painel."
        action={
          canManage ? (
            <Button variant="primary" leftIcon={<PlusIcon />} disabled>
              Convidar usuário
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          >
            <path d="M9 3a6 6 0 1 0 3.8 10.6l3.4 3.4 1.4-1.4-3.4-3.4A6 6 0 0 0 9 3Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Sem resultados"
          description="Nenhum usuário corresponde à busca."
          action={
            <Button variant="ghost" onClick={() => setQuery('')}>
              Limpar busca
            </Button>
          }
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Usuário</TH>
              <TH>Papel</TH>
              <TH>Status</TH>
              <TH>Último acesso</TH>
              <TH className="text-right">Ações</TH>
            </tr>
          </THead>
          <TBody>
            {filtered.map((u) => (
              <TR key={u.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {initials(u.fullName, u.email)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink-900">
                        {u.fullName ?? u.email}
                      </div>
                      <div className="truncate text-xs text-ink-500">{u.email}</div>
                    </div>
                  </div>
                </TD>
                <TD>
                  {u.isSuperAdmin ? (
                    <Badge tone="brand">Super Admin</Badge>
                  ) : (
                    <RoleBadge role={u.role} />
                  )}
                </TD>
                <TD>
                  {u.active ? (
                    <Badge tone="success">
                      <Dot tone="success" /> Ativo
                    </Badge>
                  ) : (
                    <Badge tone="neutral">
                      <Dot tone="neutral" /> Inativo
                    </Badge>
                  )}
                </TD>
                <TD className="text-ink-700">{formatRelative(u.lastSignInAt)}</TD>
                <TD className="text-right">
                  <button
                    type="button"
                    disabled
                    className="text-sm font-medium text-ink-400"
                    title="Em breve"
                  >
                    Gerenciar
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '';
    const b = parts[parts.length - 1]?.[0] ?? '';
    return (a + b).toUpperCase().slice(0, 2) || 'U';
  }
  return (email[0] ?? 'U').toUpperCase();
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
