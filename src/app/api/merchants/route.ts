import { NextRequest } from 'next/server';
import { z } from 'zod';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { merchantRepo } from '@/repositories/merchants';

// Lista merchants da Organization ativa. VIEWER já tem acesso.
export async function GET() {
  try {
    const session = await RBACService.requireRole('VIEWER');
    const organizationId = session.organizationId;
    if (!organizationId) {
      return Response.json({ error: 'no_organization' }, { status: 400 });
    }
    const merchants = await merchantRepo.list(organizationId);
    return Response.json({ merchants });
  } catch (err) {
    return toErrorResponse(err);
  }
}

// Configurar/atualizar credenciais iFood — só ADMIN da Organization.
const credsSchema = z.object({
  organizationId: z.string().uuid().optional(),
  environment: z.enum(['sandbox', 'production']),
  clientId: z.string().trim().min(1, 'Client ID é obrigatório').max(1000, 'Client ID muito longo'),
  clientSecret: z.string().trim().min(1, 'Client Secret é obrigatório').max(2000, 'Client Secret muito longo'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    let organizationId = session.organizationId;

    const body = await req.json();
    const input = credsSchema.parse(body);

    if (!organizationId) {
      const { organizationRepo } = await import('@/repositories/organizations');

      // Auto-create first organization for the user
      const newOrg = await organizationRepo.create({
        name: 'Marmitaria Principal',
        document: '00.000.000/0001-00',
      });

      // Link user to this organization as ADMIN
      await organizationRepo.addMember({
        organizationId: newOrg.id,
        userId: session.id,
        role: 'ADMIN',
      });
      organizationId = newOrg.id;
    }

    // Order of priority: 1. Body input, 2. Session/Auto-created orgId
    const targetOrgId = input.organizationId || organizationId;

    if (!targetOrgId) {
      return Response.json({ error: 'no_organization' }, { status: 400 });
    }

    if (targetOrgId !== organizationId && !session.isSuperAdmin) {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }

    const { ifoodCredentialRepo } = await import('@/repositories/ifood-credentials');
    await ifoodCredentialRepo.upsert({
      organizationId: targetOrgId,
      environment: input.environment,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
    });

    const { auditRepo } = await import('@/repositories/audit');
    await auditRepo.log({
      organizationId: targetOrgId,
      userId: session.id,
      action: 'ifood.credentials.upsert',
      entity: 'IfoodCredential',
      metadata: { environment: input.environment, clientId: input.clientId },
    });

    return Response.json({ ok: true });
  } catch (err: any) {
    console.error('[MERCHANTS POST ERROR]:', err);
    return Response.json(
      { error: err.message || 'Ocorreu um erro interno ao salvar credenciais' },
      { status: 500 }
    );
  }
}
