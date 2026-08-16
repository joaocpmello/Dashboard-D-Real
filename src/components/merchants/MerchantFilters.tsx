'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Table, TBody, TD, TH, THead, TR, TableEmpty } from '@/components/ui/Table';
import { MerchantStatus } from '@/components/ui/MerchantStatus';
import { EmptyState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import type { MerchantSummary } from '@/lib/data/types';

type StatusFilter = 'ALL' | 'OPEN' | 'CLOSED' | 'PAUSED' | 'INTEGRATION_PROBLEM';

const STATUS_LABEL: Record<StatusFilter, string> = {
  ALL: 'Todos',
  OPEN: 'Abertas',
  CLOSED: 'Fechadas',
  PAUSED: 'Pausadas',
  INTEGRATION_PROBLEM: 'Com problema',
};

const STATUS_TONE: Record<StatusFilter, string> = {
  ALL: 'bg-ink-100 text-ink-700',
  OPEN: 'bg-success-50 text-success-700',
  CLOSED: 'bg-ink-100 text-ink-600',
  PAUSED: 'bg-warn-50 text-warn-700',
  INTEGRATION_PROBLEM: 'bg-danger-50 text-danger-700',
};

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

export function MerchantFilters({ rows }: { rows: MerchantSummary[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      ALL: rows.length,
      OPEN: 0,
      CLOSED: 0,
      PAUSED: 0,
      INTEGRATION_PROBLEM: 0,
    };
    for (const m of rows) {
      const v = (m.status ?? '').toUpperCase();
      if (v === 'OPEN') c.OPEN++;
      else if (v === 'CLOSED') c.CLOSED++;
      else if (v === 'PAUSED') c.PAUSED++;
      else if (v.includes('INTEGRATION') || v.includes('PROBLEM')) c.INTEGRATION_PROBLEM++;
    }
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((m) => {
      if (status !== 'ALL') {
        const v = (m.status ?? '').toUpperCase();
        const matches =
          status === 'INTEGRATION_PROBLEM'
            ? v.includes('INTEGRATION') || v.includes('PROBLEM')
            : v === status;
        if (!matches) return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.corporateName ?? '').toLowerCase().includes(q) ||
        m.ifoodMerchantId.toLowerCase().includes(q) ||
        (m.city ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, query, status]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                status === s
                  ? `${STATUS_TONE[s]} ring-current/20`
                  : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50'
              }`}
            >
              {STATUS_LABEL[s]}
              <span
                className={`grid min-w-[20px] place-items-center rounded-full px-1 text-[10px] font-semibold ${
                  status === s ? 'bg-white/70' : 'bg-ink-100'
                }`}
              >
                {counts[s]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
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
            placeholder="Buscar por nome, cidade ou ID…"
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        rows.length === 0 ? (
          <EmptyState
            title="Nenhuma loja vinculada"
            description="Quando você conectar suas credenciais iFood e sincronizar, as lojas aparecerão aqui."
            action={<Button variant="secondary">Sincronizar agora</Button>}
          />
        ) : (
          <EmptyState
            title="Sem resultados para essa busca"
            description="Ajuste os filtros ou limpe o termo de pesquisa."
            action={
              <Button variant="ghost" onClick={() => { setQuery(''); setStatus('ALL'); }}>
                Limpar filtros
              </Button>
            }
          />
        )
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Loja</TH>
              <TH>Status</TH>
              <TH>Cidade</TH>
              <TH>ID iFood</TH>
              <TH>Última sincronização</TH>
              <TH className="text-right">Ações</TH>
            </tr>
          </THead>
          <TBody>
            {filtered.map((m) => (
              <TR key={m.id}>
                <TD>
                  <div className="font-medium text-ink-900">{m.name}</div>
                  {m.corporateName && m.corporateName !== m.name && (
                    <div className="text-xs text-ink-500">{m.corporateName}</div>
                  )}
                </TD>
                <TD>
                  <MerchantStatus value={m.status} />
                </TD>
                <TD className="text-ink-700">{m.city ?? '—'}</TD>
                <TD className="font-mono text-xs text-ink-600">
                  {m.ifoodMerchantId}
                </TD>
                <TD className="text-ink-700">{formatRelative(m.lastSyncedAt)}</TD>
                <TD className="text-right">
                  <Link
                    href={`/lojas/${m.id}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    Ver detalhes →
                  </Link>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
