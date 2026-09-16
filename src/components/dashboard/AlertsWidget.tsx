'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

interface Incident {
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  merchantName: string;
  message: string;
  severity: string;
}

export function AlertsWidget() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch('/api/incidents');
        if (res.ok) {
          const data = await res.json();
          setIncidents(data);
        }
      } catch (e) {
        console.error('Failed to fetch alerts', e);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  if (loading) return null;
  if (incidents.length === 0) return null; // Hide if no alerts

  const criticals = incidents.filter(i => i.type === 'CRITICAL').length;

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-ink-900">
            Alertas de Operação
          </CardTitle>
          <Badge tone="danger">{criticals} Crítico(s)</Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-2">
          {incidents.slice(0, 3).map((incident, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-ink-600">
              <span>{incident.severity}</span>
              <span className="line-clamp-1">{incident.message}</span>
            </div>
          ))}
          {incidents.length > 3 && (
            <p className="text-center text-[10px] text-ink-400">
              + {incidents.length - 3} outros alertas
            </p>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-ink-100">
          <Link
            href="/alertas"
            className="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Ver central de alertas →
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
