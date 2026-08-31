import type { IfoodEnvironment } from '@prisma/client';

export type { IfoodEnvironment };

export interface IfoodCategory {
  id: string;
  name: string;
  position?: number;
  active?: boolean;
}

export interface IfoodProduct {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface IfoodPriceUpdate {
  productId: string;
  price: number;
}
