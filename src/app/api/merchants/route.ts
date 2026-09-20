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
  organizationId: z.string().uuid(),
  environment: z.enum(['sandbox', 'production']),
  clientId: z.string().min(1).max(200),
  clientSecret: z.string().min(1).max(400),
});

export async function POST(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    let organizationId = session.organizationId;

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

    const input = credsSchema.parse(await req.json());

    // Validate organizationId if provided in input; otherwise use the auto-created/session one
    const targetOrgId = input.organizationId || organizationId;

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
