import type { OrderStatus, IfoodEnvironment } from '@prisma/client';

export type { IfoodEnvironment };

export interface IfoodOrderSummary {
  id: string;
  status: OrderStatus;
  totalValue: number;
  customer: {
    name: string;
    phone?: string;
    email?: string;
  };
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IfoodOrderDetail extends IfoodOrderSummary {
  items: IfoodOrderItem[];
  payment: {
    method: string;
    value: number;
  };
  delivery: {
    type: string;
    fee: number;
  };
}

export interface IfoodOrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IfoodOrderFilter {
  status?: OrderStatus;
  startTime?: string;
  endTime?: string;
  merchantId?: string;
}
