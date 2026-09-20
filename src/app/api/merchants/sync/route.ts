import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RBACService } from '@/lib/auth/rbac';
import { IfoodMerchantService } from '@/lib/ifood/merchant';
import { prisma } from '@/lib/db/prisma';
import { organizationRepo } from '@/repositories/organizations';

const bodySchema = z.object({
  organizationId: z.string().uuid().optional(),
  environment: z.enum(['sandbox', 'production']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    try {
      // ---------------------------------------------------------------------------
      // PASSO A: RESOLUÇÃO DE SESSÃO E ORGANIZAÇÃO
      // ---------------------------------------------------------------------------
      const session = await RBACService.requireRole('ADMIN');
      let resolvedOrgId = session.organizationId;

      const body = await req.json().catch(() => ({}));
      const input = bodySchema.parse(body);

      // Prioridade: 1. Body, 2. Session
      const requestedOrgId = input.organizationId || resolvedOrgId;

      if (!requestedOrgId) {
        // Fallback: Busca primeira organização vinculada ao usuário
        const firstOrgUser = await prisma.organizationUser.findFirst({
          where: { userId: session.id },
          orderBy: { createdAt: 'asc' },
        });

        if (firstOrgUser) {
          resolvedOrgId = firstOrgUser.organizationId;
        } else {
          // Auto-provisioning: Cria organização padrão se não houver nenhuma
          const newOrg = await organizationRepo.create({
            name: 'Marmitaria Matriz',
            document: '00.000.000/0001-00',
          });

          await organizationRepo.addMember({
            organizationId: newOrg.id,
            userId: session.id,
            role: 'ADMIN',
          });
          resolvedOrgId = newOrg.id;
        }
      } else {
        resolvedOrgId = requestedOrgId;
      }

      // Defesa: impedimos que ADMINs alterem outras orgs (Super Admin pode)
      if (resolvedOrgId !== session.organizationId && !session.isSuperAdmin) {
        return NextResponse.json({
          success: false,
          error: 'Você não tem permissão para sincronizar lojas de outra organização.'
        }, { status: 403 });
      }

      // ---------------------------------------------------------------------------
      // PASSO B: BUSCA DE CREDENCIAIS
      // ---------------------------------------------------------------------------
      const { ifoodCredentialRepo } = await import('@/repositories/ifood-credentials');
      const env = input.environment || (process.env.IFOOD_ENVIRONMENT === 'production' ? 'production' : 'sandbox');

      const creds = await ifoodCredentialRepo.publicView(resolvedOrgId, env);

      if (!creds) {
        return NextResponse.json({
          success: false,
          error: 'Nenhuma credencial do iFood (Client ID e Client Secret) cadastrada para esta organização. Cadastre as credenciais primeiro.'
        }, { status: 400 });
      }

      // ---------------------------------------------------------------------------
      // PASSO C, D e E: COMUNICAÇÃO IFOOD E PERSISTÊNCIA
      // ---------------------------------------------------------------------------
      const service = new IfoodMerchantService();
      const result = await service.listAndSync({
        organizationId: resolvedOrgId,
        actorUserId: session.id,
        environment: env,
      });

      return NextResponse.json({
        success: true,
        count: result.merchants.length,
        merchants: result.merchants,
      });

    } catch (err: any) {
      // Tratamento granular de erros conhecidos
      if (err.message?.includes('CREDENTIAL_ENCRYPTION_KEY')) {
        return NextResponse.json({
          success: false,
          error: 'Erro de configuração no servidor: CREDENTIAL_ENCRYPTION_KEY ausente ou inválida.'
        }, { status: 500 });
      }

      if (err.status === 401 || err.message?.includes('clientId/clientSecret inválidos')) {
        return NextResponse.json({
          success: false,
          error: 'O iFood rejeitou as credenciais (Client ID/Secret). Verifique se selecionou o ambiente correto (Sandbox vs Produção) e se não há caracteres extras.'
        }, { status: 400 });
      }

      if (err.status === 502 || err.message?.includes('Falha de rede')) {
        return NextResponse.json({
          success: false,
          error: 'O iFood está temporariamente indisponível. Tente novamente em instantes.'
        }, { status: 502 });
      }

      throw err; // Propaga para o catch externo
    }
  } catch (err: any) {
    console.error('ERRO CRÍTICO NO SYNC:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Erro desconhecido durante a sincronização',
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
        code: err?.code || 'SYNC_ERROR',
      },
      { status: 500 }
    );
  }
}
