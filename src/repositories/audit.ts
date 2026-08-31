import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

const isUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

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

    // Validar organizationId se fornecido
    if (input.organizationId && !isUuid(input.organizationId)) {
      throw new Error('Invalid organizationId format');
    }

    return prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: input.metadata
          ? (input.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });
  },

  async listForOrganization(organizationId: string, limit = 100) {
    if (!isUuid(organizationId)) return [];

    return prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
