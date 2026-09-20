'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ConnectStoreModal } from '@/components/merchants/ConnectStoreModal';

export function LojasActionsClient() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/merchants/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // API handles org from session
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: `Servidor retornou resposta não-JSON (HTTP ${res.status}): ${text.substring(0, 150)}` };
      }

      if (!res.ok || !data.success) {
        alert(`⚠️ Falha na Sincronização:\n\n${data.error || 'Erro desconhecido'}`);
        return;
      }

      alert('✅ Lojas sincronizadas com sucesso!');
      window.location.reload();
    } catch (err: any) {
      alert(`⚠️ Falha na Sincronização:\n\n${err.message || 'Erro desconhecido'}`);
      toast.error(err.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          onClick={handleSync}
          disabled={syncing}
          leftIcon={
            <SyncIcon className={syncing ? 'animate-spin' : ''} />
          }
        >
          {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
        </Button>

        <Button
          variant="secondary"
          onClick={() => setIsModalOpen(true)}
        >
          + Conectar Nova Loja
        </Button>
      </div>

      <ConnectStoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

function SyncIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`h-4 w-4 ${className}`}
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
