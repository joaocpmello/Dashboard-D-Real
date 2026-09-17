import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getPageContext } from '@/lib/auth/page-context';
import { requireSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Central de Ajuda · MarmitaOS',
};

export default async function AjudaPage() {
  const ctx = await getPageContext();
  if (!ctx.isDemo) await requireSession();

  return (
    <AppShell
      title="Central de Ajuda"
      subtitle="Tudo o que você precisa para operar seu SaaS"
      orgName={ctx.org?.name}
      isDemo={ctx.isDemo}
      user={{
        email: ctx.user.email,
        fullName: ctx.user.fullName,
        role: ctx.user.role,
        isSuperAdmin: ctx.user.isSuperAdmin,
      }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-ink-900 mb-4">🚀 Primeiro Passos: Credenciais iFood</h2>
          <Card>
            <CardBody className="space-y-4">
              <p className="text-sm text-ink-600">
                Para conectar suas lojas, você precisa de acesso ao <strong>Portal do Desenvolvedor iFood</strong>.
              </p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge tone="brand">Passo 1</Badge>
                  <p className="text-sm">Acesse o <a href="https://developer.ifood.com.br" target="_blank" className="text-brand-600 underline">Portal do Desenvolvedor iFood</a> e faça login com sua conta de parceiro.</p>
                </div>
                <div className="flex gap-3">
                  <Badge tone="brand">Passo 2</Badge>
                  <p className="text-sm">Vá em <strong>&quot;Meus Aplicativos&quot;</strong> e crie um novo App para a sua consultoria.</p>
                </div>
                <div className="flex gap-3">
                  <Badge tone="brand">Passo 3</Badge>
                  <p className="text-sm">Copie o <strong>Client ID</strong> e o <strong>Client Secret</strong> gerados.</p>
                </div>
                <div className="flex gap-3">
                  <Badge tone="brand">Passo 4</Badge>
                  <p className="text-sm">No MarmitaOS, vá em <strong>Configurações &rarr; Credenciais</strong> e cole as chaves.</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink-900 mb-4">❓ Perguntas Frequentes (FAQ)</h2>
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Minha loja aparece como &quot;PAUSADA&quot;, o que fazer?</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-ink-600">
                  Verifique no portal do iFood se a loja está aberta para pedidos. O MarmitaOS sincroniza o status em tempo real. Se a loja estiver aberta no iFood mas pausada aqui, tente forçar a sincronização nas configurações da loja.
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Os pedidos não estão sincronizando. Por quê?</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-ink-600">
                  Isso geralmente ocorre por credenciais expiradas ou falhas temporárias na API do iFood. Verifique a página de <strong>Alertas</strong> para ver se há notificações de erro de conexão.
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Como calculo a margem de lucro dos meus pratos?</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-ink-600">
                  Acesse a página de <strong>Margens</strong>, selecione a loja e insira o custo de produção (CMV) de cada item. O sistema subtrai automaticamente as taxas do iFood e o custo para mostrar seu lucro líquido.
                </p>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="text-center py-10">
          <h2 className="text-xl font-semibold text-ink-900 mb-2">Ainda precisa de ajuda?</h2>
          <p className="text-sm text-ink-500 mb-6">Nossa equipe de consultoria está pronta para ajudar você a escalar sua operação.</p>
          <Button className="px-8">
            Contactar Suporte via WhatsApp
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
