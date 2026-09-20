'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface SyncButtonProps {
  label: string;
  endpoint: string;
  merchantId: string;
  organizationId: string;
  icon?: React.ReactNode;
}

export function SyncButton({ label, endpoint, merchantId, organizationId, icon }: SyncButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSync() {
    setIsLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, organizationId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao sincronizar');
      }

      // Refresh the page to see new data
      router.refresh();
    } catch (err) {
      console.error(`Erro ao sincronizar ${label}:`, err);
      alert(`Erro ao sincronizar ${label}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={handleSync}
      disabled={isLoading}
      leftIcon={icon}
    >
      {isLoading ? 'Sincronizando...' : label}
    </Button>
  );
}
