'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { format } from 'date-fns';

interface SecurityAnomaly {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  userId: string | null;
  organizationId: string | null;
  timestamp: string;
  metadata: any;
}

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<SecurityAnomaly[]>([]);
  const [filterOrg, setFilterOrg] = useState('');

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/security/insights${filterOrg ? `?organizationId=${filterOrg}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) {
        setAnomalies(data.data);
      }
    } catch (e) {
      console.error('Error fetching security insights', e);
    } finally {
      setLoading(false);
    }
  }, [filterOrg]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-danger text-white';
      case 'MEDIUM': return 'bg-warn text-ink';
      case 'LOW': return 'bg-info text-white';
      default: return 'bg-ink/10 text-ink';
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-ink">Centro de Segurança</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Filtrar por Org ID..."
            className="px-3 py-2 border rounded-md text-sm"
            value={filterOrg}
            onChange={e => setFilterOrg(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-danger">
          <p className="text-sm text-ink/60">Anomalias Críticas</p>
          <p className="text-2xl font-bold text-ink">
            {anomalies.filter(a => a.severity === 'HIGH').length}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-warn">
          <p className="text-sm text-ink/60">Alertas Médios</p>
          <p className="text-2xl font-bold text-ink">
            {anomalies.filter(a => a.severity === 'MEDIUM').length}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-l-info">
          <p className="text-sm text-ink/60">Eventos Monitorados</p>
          <p className="text-2xl font-bold text-ink">
            {anomalies.length}
          </p>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold text-ink">Feed de Anomalias Detectadas</h2>
        </div>
        {anomalies.length === 0 ? (
          <EmptyState title="Nenhuma anomalia" description="O sistema não detectou padrões suspeitos no período atual." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Data/Hora</TH>
                <TH>Severidade</TH>
                <TH>Tipo</TH>
                <TH>Descrição</TH>
                <TH>Usuário/Org</TH>
              </TR>
            </THead>
            <TBody>
              {anomalies.map((anomaly, i) => (
                <TR key={i}>
                  <TD className="text-sm text-ink/60">
                    {format(new Date(anomaly.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </TD>
                  <TD>
                    <Badge className={severityColor(anomaly.severity)}>
                      {anomaly.severity}
                    </Badge>
                  </TD>
                  <TD className="font-mono text-xs">
                    {anomaly.type}
                  </TD>
                  <TD className="text-sm">{anomaly.description}</TD>
                  <TD className="text-xs text-ink/60">
                    {anomaly.userId || 'Sistema'}<br/>
                    {anomaly.organizationId || 'Global'}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
