'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface IfoodConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IfoodConnectionWizard({ isOpen, onClose }: IfoodConnectionWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<'start' | 'complete'>('start');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 State
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('production');
  const [connectionData, setConnectionData] = useState<{
    connectionId: string;
    userCode: string;
    expiresAt: Date;
    verificationUrlComplete?: string;
  } | null>(null);

  // Step 2 State
  const [authCode, setAuthCode] = useState('');

  if (!isOpen) return null;

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ifood/connections/authorize/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ environment }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao iniciar conexão');
      }

      const data = await res.json();
      setConnectionData(data);
      setStep('complete');
      toast.success('Código de autorização gerado!');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (!authCode) {
      toast.error('Por favor, insira o código de autorização.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ifood/connections/authorize/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: connectionData?.connectionId,
          authorizationCode: authCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao concluir conexão');
      }

      toast.success('Conexão estabelecida com sucesso!');
      onClose();
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-ink-400 hover:text-ink-900 transition-colors"
          aria-label="Fechar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {step === 'start' ? (
          <>
            <h2 className="text-xl font-bold text-ink-900 mb-2">Conectar com iFood</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Inicie o processo de conexão para vincular suas lojas do iFood ao dashboard.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-ink-700 mb-1">Ambiente</label>
                <select
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as any)}
                >
                  <option value="sandbox">Sandbox (Testes)</option>
                  <option value="production">Produção</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" onClick={handleStart} disabled={loading}>
                {loading ? 'Gerando...' : 'Gerar Código'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-ink-900 mb-2">Autorização iFood</h2>
            <p className="text-sm text-muted-foreground mb-6">
              O código de autorização foi gerado. Agora, siga as instruções para vincular sua conta.
            </p>

            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-ink-50 border border-ink-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-500 uppercase">Seu Código:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(connectionData?.userCode || '');
                      toast.success('Código copiado!');
                    }}
                  >
                    Copiar
                  </Button>
                </div>
                <div className="text-3xl font-mono font-bold text-center text-ink-900 tracking-widest">
                  {connectionData?.userCode}
                </div>
              </div>

              <div className="text-center">
                <a
                  href={connectionData?.verificationUrlComplete}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium underline"
                >
                  Abrir Portal do Parceiro iFood $\rightarrow$
                </a>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-ink-700 mb-1">Código de Autorização</label>
                <Input
                  type="text"
                  placeholder="XXXX-XXXX"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  className="text-center font-mono text-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => setStep('start')}>Voltar</Button>
              <Button variant="primary" onClick={handleComplete} disabled={loading}>
                {loading ? 'Concluindo...' : 'Concluir Conexão'}
              </Button>
            </div>
          </>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200 mt-4 flex gap-2 items-start">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
