import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import type { Category } from '@prisma/client';

const isUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

export const categoryRepo = {
  async findMany(input: { organizationId: string; merchantId?: string }): Promise<Category[]> {
    if (!isUuid(input.organizationId)) return [];

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.category.findMany({
        where: {
          organizationId: input.organizationId,
          ...(input.merchantId && { merchantId: input.merchantId }),
        },
        orderBy: { position: 'asc' },
      });
    });
  },

  async findIdByIfoodId(organizationId: string, ifoodCategoryId: string): Promise<string | null> {
    if (!isUuid(organizationId)) return null;

    return withTenantContext(organizationId, async (tx) => {
      const cat = await tx.category.findUnique({
        where: {
          organizationId_ifoodCategoryId: {
            organizationId,
            ifoodCategoryId,
          },
        },
      });
      return cat?.id ?? null;
    });
  },

  async upsertFromIfood(input: {
    organizationId: string;
    merchantId: string;
    ifoodCategoryId: string;
    name: string;
    position: number | null;
    active: boolean;
  }): Promise<Category> {
    if (!isUuid(input.organizationId)) {
      throw new Error('Invalid organizationId format');
    }

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.category.upsert({
        where: {
          organizationId_ifoodCategoryId: {
            organizationId: input.organizationId,
            ifoodCategoryId: input.ifoodCategoryId,
          },
        },
        update: {
          name: input.name,
          position: input.position,
          active: input.active,
        },
        create: {
          organizationId: input.organizationId,
          merchantId: input.merchantId,
          ifoodCategoryId: input.ifoodCategoryId,
          name: input.name,
          position: input.position,
          active: input.active,
        },
      });
    });
  },
};
