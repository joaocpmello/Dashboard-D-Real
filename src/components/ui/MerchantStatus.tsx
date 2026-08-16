import { Badge, Dot } from './Badge';

// Status bruto vindo do iFood (ou mockado).
// Mantemos compatibilidade: aceita string genérica.
export type MerchantStatusValue =
  | 'OPEN'
  | 'CLOSED'
  | 'PAUSED'
  | 'INTEGRATION_PROBLEM'
  | 'UNKNOWN';

const TONE: Record<MerchantStatusValue, 'success' | 'neutral' | 'warning' | 'danger' | 'info'> = {
  OPEN: 'success',
  CLOSED: 'neutral',
  PAUSED: 'warning',
  INTEGRATION_PROBLEM: 'danger',
  UNKNOWN: 'neutral',
};

const LABEL: Record<MerchantStatusValue, string> = {
  OPEN: 'Aberta',
  CLOSED: 'Fechada',
  PAUSED: 'Pausada',
  INTEGRATION_PROBLEM: 'Problema de integração',
  UNKNOWN: 'Desconhecido',
};

export function normalizeMerchantStatus(s: string | null | undefined): MerchantStatusValue {
  if (!s) return 'UNKNOWN';
  const v = s.toUpperCase();
  if (v === 'OPEN') return 'OPEN';
  if (v === 'CLOSED') return 'CLOSED';
  if (v === 'PAUSED') return 'PAUSED';
  if (v.includes('INTEGRATION') || v.includes('PROBLEM')) return 'INTEGRATION_PROBLEM';
  return 'UNKNOWN';
}

export function MerchantStatus({ value }: { value: string | null | undefined }) {
  const s = normalizeMerchantStatus(value);
  return (
    <Badge tone={TONE[s]}>
      <Dot tone={s === 'OPEN' ? 'success' : s === 'PAUSED' ? 'warning' : s === 'INTEGRATION_PROBLEM' ? 'danger' : 'neutral'} />
      {LABEL[s]}
    </Badge>
  );
}
