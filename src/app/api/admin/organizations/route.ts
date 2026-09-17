import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await RBACService.requireSuperAdmin();

    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: { merchants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(organizations);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await RBACService.requireSuperAdmin();

    const body = await req.json();
    const schema = z.object({
      organizationId: z.string().uuid(),
      plan: z.enum(['STARTER', 'PRO', 'ENTERPRISE']).optional(),
      maxMerchants: z.number().optional(),
      active: z.boolean().optional(),
    });

    const input = schema.parse(body);

    const updatedOrg = await prisma.organization.update({
      where: { id: input.organizationId },
      data: {
        ...(input.plan && { plan: input.plan }),
        ...(input.maxMerchants !== undefined && { maxMerchants: input.maxMerchants }),
        // Assuming we might add 'active' field to Organization in the future,
        // for now we just handle plan/limits.
      },
    });

    return NextResponse.json(updatedOrg);
  } catch (err) {
    return toErrorResponse(err);
  }
}
