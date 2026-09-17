'use client';

import { useState } from 'react';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function WelcomeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-10 w-10">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao MarmitaOS!</CardTitle>
          <CardDescription>
            Estamos felizes em ter você conosco. Vamos configurar sua primeira loja no iFood?
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">1</div>
              <div>
                <p className="text-sm font-medium text-ink-900">Conecte seu iFood</p>
                <p className="text-xs text-ink-500">Insira suas credenciais de API (ClientId e ClientSecret) para sincronizar seus dados.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">2</div>
              <div>
                <p className="text-sm font-medium text-ink-900">Sincronize o Cardápio</p>
                <p className="text-xs text-ink-500">O sistema irá baixar automaticamente seus produtos e categorias.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">3</div>
              <div>
                <p className="text-sm font-medium text-ink-900">Analise suas Margens</p>
                <p className="text-xs text-ink-500">Defina o custo de produção dos pratos e veja seu lucro real.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose} className="flex-1">Agora não</Button>
            <Button onClick={() => window.location.href = '/lojas'} className="flex-1">Começar agora</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
