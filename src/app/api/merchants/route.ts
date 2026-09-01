import { NextRequest } from 'next/server';
import { z } from 'zod';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { merchantRepo } from '@/repositories/merchants';

// Lista merchants da Organization ativa. VIEWER já tem acesso.
export async function GET() {
  try {
    const session = await RBACService.requireRole('VIEWER');
    if (!session.organizationId) {
      return Response.json({ error: 'no_organization' }, { status: 400 });
    }
    const merchants = await merchantRepo.list(session.organizationId);
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
    if (!session.organizationId) {
      return Response.json({ error: 'no_organization' }, { status: 400 });
    }
    const input = credsSchema.parse(await req.json());

    if (input.organizationId !== session.organizationId && !session.isSuperAdmin) {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }

    const { ifoodCredentialRepo } = await import('@/repositories/ifood-credentials');
    await ifoodCredentialRepo.upsert({
      organizationId: input.organizationId,
      environment: input.environment,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
    });

    const { auditRepo } = await import('@/repositories/audit');
    await auditRepo.log({
      organizationId: input.organizationId,
      userId: session.id,
      action: 'ifood.credentials.upsert',
      entity: 'IfoodCredential',
      metadata: { environment: input.environment, clientId: input.clientId },
    });

    return Response.json({ ok: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
