'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: any;
  createdAt: string;
  organization?: { name: string };
  user?: { email: string; fullName: string | null };
}

export default function AuditPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.ok) {
        setLogs(data.data);
      }
    } catch (e) {
      console.error('Error fetching audit logs', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Trilha de Auditoria</h1>

      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold text-ink">Registros de Alterações</h2>
        </div>
        {logs.length === 0 ? (
          <EmptyState title="Sem logs" description="Nenhum registro de auditoria encontrado." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Data/Hora</TH>
                <TH>Usuário</TH>
                <TH>Ação</TH>
                <TH>Entidade</TH>
                <TH>Detalhes</TH>
              </TR>
            </THead>
            <TBody>
              {logs.map(log => (
                <TR key={log.id}>
                  <TD className="text-sm text-ink/60">
                    {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                  </TD>
                  <TD>
                    <div className="flex flex-col">
                      <span className="font-medium">{log.user?.fullName || log.user?.email || 'Sistema'}</span>
                      <span className="text-xs text-ink/40">{log.user?.email}</span>
                    </div>
                  </TD>
                  <TD>
                    <span className="px-2 py-1 rounded bg-ink/10 text-xs font-mono">
                      {log.action}
                    </span>
                  </TD>
                  <TD>{log.entity || '-'}</TD>
                  <TD className="text-sm text-ink/60">
                    {log.metadata ? JSON.stringify(log.metadata) : '-'}
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
