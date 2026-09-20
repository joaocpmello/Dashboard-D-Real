'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Label } from '@/components/ui/Input';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  document: string;
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
  maxMerchants: number;
  _count: {
    merchants: number;
  };
  createdAt: string;
}

export default function OrganizationsClient() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: '', document: '' });
  const [creatingLoading, setCreatingLoading] = useState(false);

  async function fetchOrgs() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/organizations');
      if (!res.ok) throw new Error('Erro ao carregar organizações');
      const data = await res.json();
      setOrgs(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function handleCreateOrg() {
    setCreatingLoading(true);
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrg),
      });
      if (!res.ok) throw new Error('Erro ao criar organização');

      toast.success('Organização criada com sucesso!');
      setNewOrg({ name: '', document: '' });
      setIsCreateOpen(false);
      await fetchOrgs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingLoading(false);
    }
  }

  async function updatePlan(orgId: string, plan: 'STARTER' | 'PRO' | 'ENTERPRISE') {
    setUpdatingId(orgId);
    try {
      const res = await fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId, plan }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar plano');
      toast.success('Plano atualizado com sucesso!');
      await fetchOrgs();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  const totalLojas = orgs.reduce((acc, org) => acc + org._count.merchants, 0);
  const totalOrgs = orgs.length;

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-ink-900">Gestão de Clientes</h2>
        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
        >
          + Nova Organização
        </Button>
      </div>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardBody className="flex flex-col items-center justify-center text-center py-6">
            <p className="text-sm text-ink-500">Total de Clientes</p>
            <h3 className="text-3xl font-bold text-ink-900">{totalOrgs}</h3>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex flex-col items-center justify-center text-center py-6">
            <p className="text-sm text-ink-500">Total de Lojas</p>
            <h3 className="text-3xl font-bold text-ink-900">{totalLojas}</h3>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Organizações</CardTitle>
          <CardDescription>Gerencie planos e acessos dos seus clientes</CardDescription>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Organização</TH>
                  <TH>Documento</TH>
                  <TH>Lojas</TH>
                  <TH>Plano Atual</TH>
                  <TH className="text-right">Ações</TH>
                </TR>
              </THead>
              <TBody>
                {loading ? (
                  <TR>
                    <TD colSpan={5} className="py-10 text-center text-sm text-ink-500">
                      Carregando dados...
                    </TD>
                  </TR>
                ) : orgs.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="py-10 text-center text-sm text-ink-500">
                      Nenhuma organização cadastrada.
                    </TD>
                  </TR>
                ) : (
                  orgs.map((org) => (
                    <TR key={org.id}>
                      <TD className="font-medium text-ink-900">{org.name}</TD>
                      <TD className="text-xs text-ink-500">{org.document}</TD>
                      <TD className="text-center">
                        <Badge tone="info">{org._count.merchants} / {org.maxMerchants}</Badge>
                      </TD>
                      <TD>
                        <Badge tone={org.plan === 'ENTERPRISE' ? 'brand' : org.plan === 'PRO' ? 'success' : 'neutral'}>
                          {org.plan}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <div className="flex justify-end gap-2">
                          <select
                            className="text-xs rounded border border-ink-200 px-1 py-1 outline-none focus:ring-1 focus:ring-brand-500"
                            value={org.plan}
                            onChange={(e) => updatePlan(org.id, e.target.value as any)}
                            disabled={updatingId === org.id}
                          >
                            <option value="STARTER">Starter</option>
                            <option value="PRO">Pro</option>
                            <option value="ENTERPRISE">Enterprise</option>
                          </select>
                        </div>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Criar Nova Organização"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Nome da Organização</Label>
            <Input
              id="org-name"
              type="text"
              value={newOrg.name}
              onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
              placeholder="Ex: Marmitaria do João"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-doc">Documento (CNPJ)</Label>
            <Input
              id="org-doc"
              type="text"
              value={newOrg.document}
              onChange={(e) => setNewOrg({ ...newOrg, document: e.target.value })}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateOrg}
              disabled={creatingLoading}
            >
              {creatingLoading ? 'Criando...' : 'Criar Organização'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
