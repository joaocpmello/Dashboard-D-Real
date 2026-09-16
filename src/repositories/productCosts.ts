import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import type { ProductCost } from '@prisma/client';

const isUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

export const productCostRepo = {
  async findMany(input: {
    organizationId: string;
  }): Promise<ProductCost[]> {
    if (!isUuid(input.organizationId)) return [];

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.productCost.findMany({
        where: {
          organizationId: input.organizationId,
        },
      });
    });
  },

  async upsert(input: {
    organizationId: string;
    productId: string;
    cost: number;
  }): Promise<ProductCost> {
    if (!isUuid(input.organizationId) || !isUuid(input.productId)) {
      throw new Error('Invalid UUID format');
    }

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.productCost.upsert({
        where: {
          organizationId_productId: {
            organizationId: input.organizationId,
            productId: input.productId,
          },
        },
        update: {
          cost: input.cost,
        },
        create: {
          organizationId: input.organizationId,
          productId: input.productId,
          cost: input.cost,
        },
      });
    });
  },
};
