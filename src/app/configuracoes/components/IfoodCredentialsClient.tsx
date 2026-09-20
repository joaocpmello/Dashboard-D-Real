'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { toast } from 'sonner';

interface IfoodCredentialsClientProps {
  initialValues: {
    clientIdSb: string;
    clientSecretSb: string;
    clientIdProd: string;
    clientSecretProd: string;
  };
  organizationId: string;
  canManageCreds: boolean;
}

export function IfoodCredentialsClient({
  initialValues,
  organizationId,
  canManageCreds,
}: IfoodCredentialsClientProps) {
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      // We send both environments to the /api/merchants endpoint.
      // The API expects a request for a specific environment, so we make two calls.

      const saveEnv = async (env: 'sandbox' | 'production', id: string, secret: string) => {
        const res = await fetch('/api/merchants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId,
            environment: env,
            clientId: id,
            clientSecret: secret,
          }),
        });
        if (!res.ok) throw new Error(`Erro ao salvar credenciais de ${env}`);
      };

      await Promise.all([
        saveEnv('sandbox', values.clientIdSb, values.clientSecretSb),
        saveEnv('production', values.clientIdProd, values.clientSecretProd),
      ]);

      toast.success('Credenciais salvas com sucesso!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!canManageCreds) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 opacity-60 pointer-events-none">
        <div className="space-y-1">
          <Label htmlFor="client-id">Client ID · Sandbox</Label>
          <Input id="client-id" type="text" value={values.clientIdSb || '••••••••'} readOnly className="font-mono" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="client-secret-sb">Client Secret · Sandbox</Label>
          <Input id="client-secret-sb" type="password" value="••••••••" readOnly />
        </div>
        <div className="space-y-1">
          <Label htmlFor="client-id-prod">Client ID · Produção</Label>
          <Input id="client-id-prod" type="text" value={values.clientIdProd || 'Não configurado'} readOnly className="font-mono" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="client-secret-prod">Client Secret · Produção</Label>
          <Input id="client-secret-prod" type="password" value="••••••••" readOnly />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="clientIdSb">Client ID · Sandbox</Label>
          <Input
            id="clientIdSb"
            type="text"
            className="font-mono"
            value={values.clientIdSb}
            onChange={(e) => setValues({ ...values, clientIdSb: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="clientSecretSb">Client Secret · Sandbox</Label>
          <Input
            id="clientSecretSb"
            type="password"
            value={values.clientSecretSb}
            onChange={(e) => setValues({ ...values, clientSecretSb: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="clientIdProd">Client ID · Produção</Label>
          <Input
            id="clientIdProd"
            type="text"
            className="font-mono"
            value={values.clientIdProd}
            onChange={(e) => setValues({ ...values, clientIdProd: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="clientSecretProd">Client Secret · Produção</Label>
          <Input
            id="clientSecretProd"
            type="password"
            value={values.clientSecretProd}
            onChange={(e) => setValues({ ...values, clientSecretProd: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Salvar Credenciais'}
        </Button>
      </div>
    </div>
  );
}
