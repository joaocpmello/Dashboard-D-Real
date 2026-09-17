'use client';

import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table';

interface PlanComparison {
  name: string;
  limit: string;
  features: string[];
  price: string;
  current: boolean;
}

export default function PlanoClient({
  orgName,
  user,
  isDemo,
  orgData,
  merchantCount
}: {
  orgName?: string;
  user: any;
  isDemo: boolean;
  orgData: { plan: string; maxMerchants: number };
  merchantCount: number;
}) {
  const plans: PlanComparison[] = [
    {
      name: 'Starter',
      limit: 'Até 2 lojas',
      features: ['Sincronização básica', 'Relatórios mensais', 'Suporte via e-mail'],
      price: 'Grátis',
      current: orgData.plan === 'STARTER',
    },
    {
      name: 'Pro',
      limit: 'Até 10 lojas',
      features: ['Sincronização prioritária', 'Relatórios em tempo real', 'Suporte via WhatsApp'],
      price: 'R$ 99/mês',
      current: orgData.plan === 'PRO',
    },
    {
      name: 'Enterprise',
      limit: 'Lojas ilimitadas',
      features: ['API de Integração', 'Consultoria dedicada', 'Suporte 24/7'],
      price: 'Sob consulta',
      current: orgData.plan === 'ENTERPRISE',
    },
  ];

  return (
    <>
      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Seu Plano Atual</CardTitle>
            <CardDescription>Detalhes da sua assinatura</CardDescription>
          </CardHeader>
          <CardBody className="flex flex-col items-center justify-center text-center py-8">
            <div className="mb-4 rounded-full bg-brand-100 p-4 text-brand-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-ink-900 uppercase">
              {orgData.plan}
            </h3>
            <p className="text-sm text-ink-500 mt-1">
              {merchantCount} de {orgData.maxMerchants} lojas utilizadas
            </p>

            {merchantCount >= orgData.maxMerchants && (
              <Badge tone="danger" className="mt-4">Limite Atingido</Badge>
            )}
          </CardBody>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Uso de Recursos</CardTitle>
            <CardDescription>Acompanhe a utilização do seu plano</CardDescription>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-ink-700">Lojas Cadastradas</span>
                  <span className="text-sm font-bold text-ink-900">{merchantCount} / {orgData.maxMerchants}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (merchantCount / orgData.maxMerchants) > 0.8 ? 'bg-danger-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${Math.min((merchantCount / orgData.maxMerchants) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Planos</CardTitle>
          <CardDescription>Escolha a melhor opção para o tamanho da sua consultoria</CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Plano</TH>
                  <TH>Limite de Lojas</TH>
                  <TH>Recursos</TH>
                  <TH className="text-right">Preço</TH>
                  <TH className="text-center">Status</TH>
                </TR>
              </THead>
              <TBody>
                {plans.map((plan) => (
                  <TR key={plan.name}>
                    <TD className="font-bold text-ink-900">{plan.name}</TD>
                    <TD>{plan.limit}</TD>
                    <TD>
                      <ul className="list-disc list-inside text-xs text-ink-600 space-y-1">
                        {plan.features.map(f => <li key={f}>{f}</li>)}
                      </ul>
                    </TD>
                    <TD className="text-right font-medium">{plan.price}</TD>
                    <TD className="text-center">
                      {plan.current ? (
                        <Badge tone="success">Ativo</Badge>
                      ) : (
                        <Badge tone="neutral">Disponível</Badge>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
