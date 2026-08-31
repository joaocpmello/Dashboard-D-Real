import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import type { ProductPrice } from '@prisma/client';

const isUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

export const productPriceRepo = {
  async findLatest(input: {
    organizationId: string;
    productId: string;
  }): Promise<ProductPrice | null> {
    if (!isUuid(input.organizationId)) return null;

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.productPrice.findFirst({
        where: {
          organizationId: input.organizationId,
          productId: input.productId,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  },

  async create(input: {
    organizationId: string;
    productId: string;
    price: number;
  }): Promise<ProductPrice> {
    if (!isUuid(input.organizationId)) {
      throw new Error('Invalid organizationId format');
    }

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.productPrice.create({
        data: {
          organizationId: input.organizationId,
          productId: input.productId,
          price: input.price,
        },
      });
    });
  },
};
