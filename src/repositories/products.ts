import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import type { Product } from '@prisma/client';

const isUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

export const productRepo = {
  async findMany(input: {
    organizationId: string;
    merchantId?: string;
    categoryId?: string;
  }): Promise<Product[]> {
    if (!isUuid(input.organizationId)) return [];

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.product.findMany({
        where: {
          organizationId: input.organizationId,
          ...(input.merchantId && { merchantId: input.merchantId }),
          ...(input.categoryId && { categoryId: input.categoryId }),
        },
      });
    });
  },

  async upsertFromIfood(input: {
    organizationId: string;
    merchantId: string;
    categoryId: string;
    ifoodProductId: string;
    name: string;
    description: string | null;
    active: boolean;
  }): Promise<Product> {
    if (!isUuid(input.organizationId)) {
      throw new Error('Invalid organizationId format');
    }

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.product.upsert({
        where: {
          organizationId_ifoodProductId: {
            organizationId: input.organizationId,
            ifoodProductId: input.ifoodProductId,
          },
        },
        update: {
          name: input.name,
          description: input.description,
          active: input.active,
        },
        create: {
          organizationId: input.organizationId,
          merchantId: input.merchantId,
          categoryId: input.categoryId,
          ifoodProductId: input.ifoodProductId,
          name: input.name,
          description: input.description,
          active: input.active,
        },
      });
    });
  },
};
