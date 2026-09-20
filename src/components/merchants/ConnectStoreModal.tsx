'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ConnectStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectStoreModal({ isOpen, onClose }: ConnectStoreModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');

  async function handleSave() {
    if (!clientId || !clientSecret) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      // 1. Save credentials first
      const resCreds = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment,
          clientId,
          clientSecret,
        }),
      });
      if (!resCreds.ok) throw new Error('Erro ao salvar credenciais');

      // 2. Immediately trigger sync
      const resSync = await fetch('/api/merchants/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment }),
      });
      if (!resSync.ok) throw new Error('Erro ao sincronizar lojas');

      toast.success('Lojas conectadas e sincronizadas com sucesso!');
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Conectar Nova Loja iFood">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Ambiente</Label>
          <select
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as any)}
          >
            <option value="sandbox">Sandbox (Testes)</option>
            <option value="production">Produção</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientId">Client ID</Label>
          <Input
            id="clientId"
            type="text"
            className="font-mono"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Ex: aaaa-bbbb-cccc..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientSecret">Client Secret</Label>
          <Input
            id="clientSecret"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="••••••••••••"
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Conectando...' : 'Salvar e Sincronizar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
