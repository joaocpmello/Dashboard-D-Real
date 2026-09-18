'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type ApiEndpoint = {
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
};

const ENDPOINTS: ApiEndpoint[] = [
  { name: 'Health Check', path: '/api/health', method: 'GET', description: 'Verifica a saúde do sistema e conexões' },
  { name: 'Sincronizar Pedidos', path: '/api/orders/sync', method: 'GET', description: 'Força a sincronização de pedidos do iFood' },
  { name: 'Sincronizar Merchants', path: '/api/merchants/sync', method: 'GET', description: 'Força a sincronização de merchants' },
  { name: 'Sincronizar Pedidos (Cron)', path: '/api/cron/sync-orders', method: 'GET', description: 'Endpoint de cron para sincronização de pedidos' },
  { name: 'Sincronizar Merchants (Cron)', path: '/api/cron/sync-merchants', method: 'GET', description: 'Endpoint de cron para sincronização de merchants' },
  { name: 'Poll Events (Cron)', path: '/api/cron/poll-events', method: 'GET', description: 'Processa eventos em tempo real do iFood' },
  { name: 'Audit Logs', path: '/api/audit-logs', method: 'GET', description: 'Lista logs de auditoria' },
  { name: 'Relatório de Vendas', path: '/api/reports/sales', method: 'GET', description: 'Gera agregação de vendas' },
  { name: 'Exportar CSV', path: '/api/reports/export', method: 'GET', description: 'Exporta dados de pedidos para CSV' },
  { name: 'Incidentes', path: '/api/incidents', method: 'GET', description: 'Lista incidentes detectados' },
  { name: 'Security Insights', path: '/api/security/insights', method: 'GET', description: 'Insights de segurança do sistema' },
  { name: 'Catalog Margins', path: '/api/catalog/margins', method: 'GET', description: 'Calcula margens de lucro do cardápio' },
  { name: 'Organizations (Admin)', path: '/api/admin/organizations', method: 'GET', description: 'Lista todas as organizações (Super Admin)' },
];

export default function ApiDebugPage() {
  const [results, setResults] = useState<Record<string, { status: number; data: any; error: string | null }>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  async function callApi(endpoint: ApiEndpoint) {
    setLoading(prev => ({ ...prev, [endpoint.path]: true }));
    try {
      const res = await fetch(endpoint.path, {
        method: endpoint.method,
      });
      const data = await res.json().catch(() => ({ message: 'No JSON response' }));
      setResults(prev => ({
        ...prev,
        [endpoint.path]: { status: res.status, data, error: null }
      }));
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        [endpoint.path]: { status: 0, data: null, error: err.message }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [endpoint.path]: false }));
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-900">API Explorer (Debug)</h1>
        <p className="text-ink-600 mt-2">
          Teste todos os endpoints da API diretamente do navegador.
          Os requests usam a sessão atual do browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENDPOINTS.map((endpoint) => (
          <Card key={endpoint.path} className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-ink-800">{endpoint.name}</h3>
                <Badge tone="neutral" className="text-[10px]">
                  {endpoint.method}
                </Badge>
              </div>
              <p className="text-xs text-ink-500 mb-4">{endpoint.description}</p>
              <code className="block text-[10px] bg-ink-100 p-2 rounded mb-4 overflow-hidden text-ellipsis whitespace-nowrap">
                {endpoint.path}
              </code>
            </div>
            <Button
              onClick={() => callApi(endpoint)}
              disabled={loading[endpoint.path]}
              size="sm"
            >
              {loading[endpoint.path] ? 'Chamando...' : 'Executar'}
            </Button>
          </Card>
        ))}
      </div>

      {Object.keys(results).length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-ink-900 mb-4">Resultados</h2>
          <div className="space-y-4">
            {Object.entries(results).map(([path, result]) => (
              <div key={path} className="rounded-lg border border-ink-200 overflow-hidden">
                <div className="bg-ink-50 px-4 py-2 border-b border-ink-200 flex justify-between items-center">
                  <span className="text-sm font-mono font-medium">{path}</span>
                  <span className={`text-xs font-bold ${result.status >= 200 && result.status < 300 ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {result.status}
                  </span>
                </div>
                <div className="p-4 bg-white overflow-x-auto">
                  <pre className="text-xs font-mono text-ink-700">
                    {result.error ? (
                      <span className="text-red-500">{result.error}</span>
                    ) : (
                      JSON.stringify(result.data, null, 2)
                    )}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
