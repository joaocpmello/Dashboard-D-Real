import type { ReactNode } from 'react';

export function LoadingState({ message = 'Carregando…' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-8 text-sm text-ink-500">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500"
        aria-hidden
      />
      {message}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
      <div className="mx-auto max-w-sm">
        <h4 className="text-sm font-semibold text-ink-800">{title}</h4>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}

export function ErrorState({
  message = 'Não foi possível carregar os dados.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-danger-500/30 bg-danger-50 px-4 py-4 text-sm text-danger-700">
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-danger-500/40 bg-white px-3 py-1 text-xs font-medium text-danger-700 hover:bg-danger-50"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
