import { NextRequest, NextResponse } from 'next/server';
import { RBACService } from '@/lib/auth/rbac';
import { toErrorResponse } from '@/lib/auth/errors';
import { IfoodCatalogService } from '@/lib/ifood/catalog';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { productRepo } from '@/repositories/products';
import { productPriceRepo } from '@/repositories/product-prices';

const PriceUpdateSchema = z.object({
  ifoodProductId: z.string(),
  newPrice: z.number().positive(),
});

const BulkPriceUpdateSchema = z.object({
  productIds: z.array(z.string()).min(1),
  adjustment: z.number(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    if (!session.organizationId) throw new Error('Organização não definida');

    const body = await req.json();
    const { ifoodProductId, newPrice } = PriceUpdateSchema.parse(body);

    const service = new IfoodCatalogService();
    await service.updatePrice({
      organizationId: session.organizationId,
      ifoodProductId,
      newPrice,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await RBACService.requireRole('ADMIN');
    if (!session.organizationId) throw new Error('Organização não definida');

    const body = await req.json();
    const { productIds, adjustment } = BulkPriceUpdateSchema.parse(body);

    const service = new IfoodCatalogService();

    // 1. Resolve internal IDs to iFood IDs
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        organizationId: session.organizationId,
      },
    });

    if (products.length === 0) {
      return NextResponse.json({ error: 'Nenhum produto encontrado' }, { status: 404 });
    }

    // 2. Process updates
    const results = await Promise.allSettled(
      products.map(async (p) => {
        // Get latest price for calculation
        const priceRow = await productPriceRepo.findLatest({
          organizationId: session.organizationId,
          productId: p.id,
        });

        const currentPrice = Number(priceRow?.price ?? 0);
        if (currentPrice === 0) throw new Error(`Preço não encontrado para ${p.name}`);

        const multiplier = 1 + adjustment / 100;
        const newPrice = Math.round(currentPrice * multiplier * 100) / 100;

        await service.updatePrice({
          organizationId: session.organizationId,
          ifoodProductId: p.ifoodProductId!,
          newPrice,
        });

        return { id: p.id, name: p.name, newPrice };
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').map((r) => (r as PromiseFulfilledResult<any>).value);
    const failed = results.filter((r) => r.status === 'rejected').map((r) => (r as PromiseRejectedResult).reason);

    return NextResponse.json({
      success: true,
      updatedCount: successful.length,
      failedCount: failed.length,
      details: successful,
      errors: failed,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
