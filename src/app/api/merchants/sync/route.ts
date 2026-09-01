import { NextRequest } from 'next/server';
import { z } from 'zod';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { IfoodMerchantService } from '@/lib/ifood/merchant';

const bodySchema = z.object({
  organizationId: z.string().uuid(),
  environment: z.enum(['sandbox', 'production']).optional(),
});

// Sincroniza merchants da Organization ativa com o iFood.
// Requer ADMIN+ da Organization correspondente.
export async function POST(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    if (!session.organizationId) {
      return Response.json({ error: 'no_organization' }, { status: 400 });
    }
    const input = bodySchema.parse(await req.json());

    // Defesa: só permite sincronizar a própria Organization.
    if (input.organizationId !== session.organizationId && !session.isSuperAdmin) {
      return Response.json({ error: 'forbidden' }, { status: 403 });
    }

    const service = new IfoodMerchantService();
    const result = await service.listAndSync({
      organizationId: input.organizationId,
      actorUserId: session.id,
      environment: input.environment,
    });

    return Response.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
