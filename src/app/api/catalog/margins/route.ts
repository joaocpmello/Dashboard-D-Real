import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { toErrorResponse } from '@/lib/auth/errors';
import { productRepo } from '@/repositories/products';
import { productPriceRepo } from '@/repositories/product-prices';
import { productCostRepo } from '@/repositories/productCosts';
import { z } from 'zod';

const QuerySchema = z.object({
  merchantId: z.string(),
  ifoodFee: z.string().optional().transform(val => val ? parseFloat(val) / 100 : 0.20),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const organizationId = session.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organização não definida' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams));

    const products = await productRepo.findMany({
      organizationId,
      merchantId: query.merchantId,
    });

    const margins = await Promise.all(products.map(async (product) => {
      const priceObj = await productPriceRepo.findLatest({
        organizationId,
        productId: product.id,
      });

      const costObj = await productCostRepo.findMany({
        organizationId,
      }).then(costs => costs.find(c => c.productId === product.id));

      const price = priceObj?.price ? Number(priceObj.price) : 0;
      const cost = costObj?.cost ? Number(costObj.cost) : 0;
      const fee = query.ifoodFee;

      const revenueAfterFee = price * (1 - fee);
      const netProfit = revenueAfterFee - cost;
      const marginPercentage = revenueAfterFee > 0 ? (netProfit / revenueAfterFee) * 100 : 0;

      return {
        productId: product.id,
        name: product.name,
        price,
        cost,
        fee: fee * 100,
        netProfit,
        marginPercentage,
      };
    }));

    return NextResponse.json(margins);
  } catch (err) {
    return toErrorResponse(err);
  }
}
