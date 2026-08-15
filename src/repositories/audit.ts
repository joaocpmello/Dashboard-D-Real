import 'server-only';
import { prisma } from '@/lib/db/prisma';

export const auditRepo = {
  log(input: {
    organizationId: string | null;
    userId: string | null;
    action: string;
    entity?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    // Audit é uma operação "trusted" no servidor — não passa por RLS por convenção,
    // mas as políticas de audit_logs já permitem gravação com current_org_id nulo
    // (eventos globais do SUPER_ADMIN). Mantemos via prisma direto.
    return prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: input.metadata ?? undefined,
      },
    });
  },

  listForOrganization(organizationId: string, limit = 100) {
    return prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
