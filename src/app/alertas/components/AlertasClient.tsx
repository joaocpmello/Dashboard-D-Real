'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR
} from '@/components/ui/Table';
import { toast } from 'sonner';

interface Incident {
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  merchantId: string;
  merchantName: string;
  message: string;
  category: string;
  severity: string;
}

export default function AlertasClient({
  user,
  isDemo
}: {
  user: any;
  isDemo: boolean;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchIncidents() {
    setLoading(true);
    try {
      const res = await fetch('/api/incidents');
      if (!res.ok) throw new Error('Erro ao carregar alertas');
      const data = await res.json();
      setIncidents(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIncidents();
  }, []);

  async function handleResolve(incident: Incident) {
    toast.info(`Sincronizando loja ${incident.merchantName}...`);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Operação disparada com sucesso!');
      await fetchIncidents();
    } catch (err: any) {
      toast.error('Erro ao processar ação');
    }
  }

  return (
    <>
      <section className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink-900">Incidentes Ativos</h2>
            <p className="text-sm text-ink-600">Notificações prioritárias sobre a saúde das suas lojas.</p>
          </div>
          <Button onClick={fetchIncidents} variant="secondary" size="sm">
            Atualizar agora
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Painel de Ocorrências</CardTitle>
          <CardDescription>Alertas automáticos baseados em regras de negócio e performance.</CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Severidade</TH>
                  <TH>Loja</TH>
                  <TH>Mensagem</TH>
                  <TH>Categoria</TH>
                  <TH className="text-right">Ação</TH>
                </TR>
              </THead>
              <TBody>
                {loading ? (
                  <TR>
                    <TD colSpan={5} className="py-10 text-center text-sm text-ink-500">
                      Analisando operação...
                    </TD>
                  </TR>
                ) : incidents.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="py-10 text-center text-sm text-ink-500">
                      Tudo tranquilo por aqui! Nenhuma anomalia detectada.
                    </TD>
                  </TR>
                ) : (
                  incidents.map((incident, idx) => (
                    <TR key={idx}>
                      <TD>
                        <span className="text-lg" title={incident.type}>{incident.severity}</span>
                      </TD>
                      <TD className="font-medium text-ink-900">{incident.merchantName}</TD>
                      <TD>{incident.message}</TD>
                      <TD>
                        <Badge tone="neutral">{incident.category}</Badge>
                      </TD>
                      <TD className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleResolve(incident)}
                          className="h-8 px-3"
                        >
                          Resolver
                        </Button>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
