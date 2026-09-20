import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { IfoodMerchantService } from '@/lib/ifood/merchant';
import { prisma } from '@/lib/db/prisma';
import { organizationRepo } from '@/repositories/organizations';

const bodySchema = z.object({
  organizationId: z.string().uuid().optional(),
  environment: z.enum(['sandbox', 'production']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    let organizationId = session.organizationId;

    const body = await req.json();
    const input = bodySchema.parse(body);

    // Order of priority: 1. Body input, 2. Session orgId
    const requestedOrgId = input.organizationId || organizationId;

    if (!requestedOrgId) {
      // Fallback: search first organization linked to user
      const { prisma } = await import('@/lib/db/prisma');
      const firstOrgUser = await prisma.organizationUser.findFirst({
        where: { userId: session.id },
        orderBy: { createdAt: 'asc' },
      });

      if (!firstOrgUser) {
        return NextResponse.json({
          success: false,
          error: 'Nenhuma organização associada a este usuário. Crie uma organização primeiro.'
        }, { status: 400 });
      }
      organizationId = firstOrgUser.organizationId;
    } else {
      organizationId = requestedOrgId;
    }

    // Defense: only allow syncing the assigned organization unless Super Admin
    if (organizationId !== session.organizationId && !session.isSuperAdmin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // VERIFICAÇÃO DE CREDENCIAIS: Check if credentials exist for the resolved organization
    const { ifoodCredentialRepo } = await import('@/repositories/ifood-credentials');
    const env = input.environment || (process.env.IFOOD_ENVIRONMENT === 'production' ? 'production' : 'sandbox');
    const creds = await ifoodCredentialRepo.publicView(organizationId, env);

    if (!creds) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma credencial iFood (Client ID/Client Secret) cadastrada para esta organização. Clique em "+ Conectar Credenciais iFood" primeiro.'
      }, { status: 400 });
    }

    const service = new IfoodMerchantService();
    const result = await service.listAndSync({
      organizationId,
      actorUserId: session.id,
      environment: input.environment,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[MERCHANTS SYNC ERROR]:', err);

    if (err.message?.includes('clientId/clientSecret inválidos') || err.status === 401) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais do iFood rejeitadas: verifique o Client ID e Client Secret informados.'
      }, { status: 400 });
    }

    if (err.message?.includes('CREDENTIAL_ENCRYPTION_KEY')) {
      return NextResponse.json({
        success: false,
        error: 'Erro de chave de criptografia de servidor no ambiente.'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Falha ao comunicar com a API do iFood',
      details: String(err)
    }, { status: 500 });
  }
}
