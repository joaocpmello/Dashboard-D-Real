export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { auditRepo } from '@/repositories/audit';
import { toErrorResponse } from '@/lib/auth/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    if (session.isSuperAdmin) {
      // SUPER_ADMIN can see all logs across all organizations
      // The auditRepo.listForOrganization is too restrictive, so we use prisma directly
      const { prisma } = await import('@/lib/db/prisma');
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          organization: { select: { name: true } },
          user: { select: { email: true, fullName: true } },
        },
      });
      return NextResponse.json({ ok: true, data: logs });
    }

    // Regular ADMIN sees only their org logs
    const logs = await auditRepo.listForOrganization(session.organizationId!, limit);

    // Enrich logs with user info
    const { prisma } = await import('@/lib/db/prisma');
    const enrichedLogs = await Promise.all(logs.map(async (log) => {
      const user = await prisma.user.findUnique({
        where: { id: log.userId || '' },
        select: { email: true, fullName: true },
      });
      return { ...log, user };
    }));

    return NextResponse.json({ ok: true, data: enrichedLogs });
  } catch (error: any) {
    return toErrorResponse(error, error.status || 500);
  }
}
