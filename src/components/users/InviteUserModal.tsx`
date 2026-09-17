'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

export function InviteUserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('OPERATOR');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleInvite() {
    setLoading(true);
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) throw new Error('Erro ao enviar convite');
      const data = await res.json();
      setInviteLink(data.inviteLink);
      toast.success('Convite gerado com sucesso!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle>Convidar Novo Membro</CardTitle>
          <CardDescription>Envie um convite para adicionar um usuário à sua organização.</CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          {inviteLink ? (
            <div className="space-y-4 text-center py-4">
              <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-700 border border-brand-100 break-all font-mono">
                {inviteLink}
              </div>
              <p className="text-xs text-ink-500">Copie o link acima e envie ao usuário. O link expira em 24h.</p>
              <Button onClick={onClose} className="w-full">Concluído</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-700">E-mail</label>
                <Input
                  type="email"
                  placeholder="usuario@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink-700">Papel de Acesso</label>
                <select
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="OPERATOR">Operador</option>
                  <option value="VIEWER">Visualizador</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" onClick={onClose} className="flex-1">Cancelar</Button>
                <Button onClick={handleInvite} disabled={loading || !email} className="flex-1">
                  {loading ? 'Enviando...' : 'Enviar Convite'}
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
