import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import type { UserRole } from '@prisma/client';

export const organizationRepo = {
  // Acesso cross-tenant — apenas SUPER_ADMIN chama isto.
  listAll() {
    return prisma.organization.findMany({ orderBy: { createdAt: 'desc' } });
  },

  create(input: { name: string; document: string }) {
    return prisma.organization.create({ data: input });
  },

  // Lista usuários da Organization ativa, dentro do contexto de tenant.
  listMembers(organizationId: string) {
    return withTenantContext(organizationId, (tx) =>
      tx.organizationUser.findMany({
        where: { organizationId },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      }),
    );
  },

  addMember(input: {
    organizationId: string;
    userId: string;
    role: UserRole;
  }) {
    return withTenantContext(input.organizationId, (tx) =>
      tx.organizationUser.upsert({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: input.userId,
          },
        },
        update: { role: input.role },
        create: input,
      }),
    );
  },

  updateMemberRole(input: {
    organizationId: string;
    userId: string;
    role: UserRole;
  }) {
    return withTenantContext(input.organizationId, (tx) =>
      tx.organizationUser.update({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: input.userId,
          },
        },
        data: { role: input.role },
      }),
    );
  },
};
