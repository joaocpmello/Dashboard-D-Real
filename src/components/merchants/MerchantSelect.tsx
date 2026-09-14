'use client';
import { Select } from '@/components/ui/Select';
import { useEffect, useState } from 'react';

type Props = {
  defaultValue?: string;
  onChange: (id: string) => void;
};

export function MerchantSelect({ defaultValue, onChange }: Props) {
  const [merchants, setMerchants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMerchants() {
      try {
        const res = await fetch('/api/merchants');
        if (!res.ok) throw new Error('Erro ao carregar lojas');
        const data = await res.json();
        setMerchants(data.merchants.map((m: any) => ({
          id: m.id,
          name: m.name ?? `Loja ${m.ifoodMerchantId}`,
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMerchants();
  }, []);

  if (loading) return <div className="h-10 w-full animate-pulse rounded-md bg-ink-100" />;

  return (
    <Select
      defaultValue={defaultValue}
      onChange={(value) => onChange(value)}
    >
      <option value="" disabled>Selecione uma loja...</option>
      {merchants.map(m => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </Select>
  );
}
