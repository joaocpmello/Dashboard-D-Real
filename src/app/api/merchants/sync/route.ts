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

    // Fallback: find first organization for the user if none is active in session
    if (!organizationId) {
      const firstOrg = await prisma.organization.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (!firstOrg) {
        return NextResponse.json({
          success: false,
          error: 'Nenhuma organização encontrada. Crie uma organização primeiro.'
        }, { status: 400 });
      }
      organizationId = firstOrg.id;
    }

    const body = await req.json();
    const input = bodySchema.parse(body);

    // Priority for organizationId: body input -> session/resolved orgId
    const targetOrgId = input.organizationId || organizationId;

    // Defense: only allow syncing the assigned organization unless Super Admin
    if (targetOrgId !== organizationId && !session.isSuperAdmin) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    const service = new IfoodMerchantService();
    const result = await service.listAndSync({
      organizationId: targetOrgId,
      actorUserId: session.id,
      environment: input.environment,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[MERCHANTS SYNC ERROR]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Falha ao comunicar com a API do iFood',
        details: String(err)
      },
      { status: 500 }
    );
  }
}
