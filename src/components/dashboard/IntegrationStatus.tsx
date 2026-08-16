import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, Dot } from '@/components/ui/Badge';

type Props = {
  connected: boolean;
  lastSyncAt: string | null;
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

export function IntegrationStatus({ connected, lastSyncAt }: Props) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Integração iFood</CardTitle>
          <CardDescription>Status da conexão com a API do iFood</CardDescription>
        </div>
        {connected ? (
          <Badge tone="success">
            <Dot tone="success" />
            Conectado
          </Badge>
        ) : (
          <Badge tone="danger">
            <Dot tone="danger" />
            Desconectado
          </Badge>
        )}
      </CardHeader>
      <CardBody>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink-500">Última sincronização</dt>
            <dd className="font-medium text-ink-800">{formatRelative(lastSyncAt)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink-500">Ambiente</dt>
            <dd className="font-medium text-ink-800">Sandbox</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink-500">Token de acesso</dt>
            <dd className="font-medium text-ink-800">Renovação automática</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink-500">
          Credenciais são criptografadas em repouso e nunca expostas no cliente.
        </p>
      </CardBody>
    </Card>
  );
}
