import Link from 'next/link';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { MerchantStatus } from '@/components/ui/MerchantStatus';
import type { MerchantSummary } from '@/lib/data/types';

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

export function MerchantTable({ rows }: { rows: MerchantSummary[] }) {
  return (
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
        {rows.map((m) => (
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
            <TD className="font-mono text-xs text-ink-600">{m.ifoodMerchantId}</TD>
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
  );
}
