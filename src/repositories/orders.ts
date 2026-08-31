import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { withTenantContext } from '@/lib/db/tenant';
import type { Order, OrderItem } from '@prisma/client';
import { Prisma } from '@prisma/client';

const isUuid = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

export const orderRepo = {
  async findMany(input: {
    organizationId: string;
    merchantId?: string;
    status?: string;
    startTime?: Date;
    endTime?: Date;
    skip?: number;
    take?: number;
  }): Promise<Order[]> {
    if (!isUuid(input.organizationId)) return [];

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.order.findMany({
        where: {
          organizationId: input.organizationId,
          ...(input.merchantId && { merchantId: input.merchantId }),
          ...(input.status && { status: input.status as any }),
          ...(input.startTime && { createdAt: { gte: input.startTime } }),
          ...(input.endTime && { createdAt: { lte: input.endTime } }),
        },
        orderBy: { createdAt: 'desc' },
        skip: input.skip,
        take: input.take,
      });
    });
  },

  async findById(input: {
    organizationId: string;
    id: string;
  }): Promise<Order | null> {
    if (!isUuid(input.organizationId)) return null;

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.order.findUnique({
        where: {
          id: input.id,
        },
        include: { items: true },
      });
    });
  },

  async upsertFromIfood(input: {
    organizationId: string;
    merchantId: string;
    ifoodOrderId: string;
    status: any;
    total: number;
    customerName: string | null;
    customerPhone: string | null;
    customerAddress: string | null;
    createdAt: Date;
  }): Promise<Order> {
    if (!isUuid(input.organizationId)) {
      throw new Error('Invalid organizationId format');
    }

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.order.upsert({
        where: {
          organizationId_ifoodOrderId: {
            organizationId: input.organizationId,
            ifoodOrderId: input.ifoodOrderId,
          },
        },
        update: {
          status: input.status,
          total: input.total,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress,
        },
        create: {
          organizationId: input.organizationId,
          merchantId: input.merchantId,
          ifoodOrderId: input.ifoodOrderId,
          status: input.status,
          total: input.total,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerAddress: input.customerAddress,
          createdAt: input.createdAt,
        },
      });
    });
  },

  async createOrderItem(input: {
    orderId: string;
    organizationId: string;
    ifoodProductId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }): Promise<OrderItem> {
    if (!isUuid(input.organizationId)) {
      throw new Error('Invalid organizationId format');
    }

    return withTenantContext(input.organizationId, async (tx) => {
      return tx.orderItem.create({
        data: {
          orderId: input.orderId,
          ifoodProductId: input.ifoodProductId,
          productName: input.productName,
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          totalPrice: input.totalPrice,
        },
      });
    });
  },
};
