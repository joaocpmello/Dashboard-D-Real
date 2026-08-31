import 'server-only';
import { IfoodClient } from '@/lib/ifood/client';
import { IfoodAuthService } from '@/lib/ifood/auth';
import { ifoodCredentialRepo } from '@/repositories/ifood-credentials';
import { categoryRepo } from '@/repositories/categories';
import { productRepo } from '@/repositories/products';
import { productPriceRepo } from '@/repositories/product-prices';
import { resolveEnvironment } from '@/lib/ifood/merchant';
import type {
  IfoodEnvironment,
  IfoodCategory,
  IfoodProduct,
  IfoodPriceUpdate,
} from '@/lib/ifood/types/catalog';
import type { IfoodToken } from '@/lib/ifood/types/token';

async function fetchAccessTokenFromIfood(
  clientId: string,
  clientSecret: string,
): Promise<{ accessToken: string; type: 'bearer'; expiresIn: number }> {
  const url = `${new IfoodClient().baseUrl}/authentication/v1.0/oauth/token`;
  const body = new URLSearchParams({
    grantType: 'client_credentials',
    clientId,
    clientSecret,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`iFood Auth Error: ${res.status}`);
  }
  return res.json();
}

function buildAuthService(): IfoodAuthService {
  return new IfoodAuthService(
    fetchAccessTokenFromIfood,
    async (organizationId, env) => {
      const c = await ifoodCredentialRepo.loadDecrypted(organizationId, env);
      return { clientId: c.clientId, clientSecret: c.clientSecret };
    },
    async (organizationId, env, token: IfoodToken) => {
      await ifoodCredentialRepo.persistAccessToken(
        organizationId,
        env,
        token.token,
        token.expiresAt,
      );
    },
  );
}

export class IfoodCatalogService {
  private readonly client = new IfoodClient();
  private readonly auth = buildAuthService();

  async getCatalog(input: {
    organizationId: string;
    merchantId: string;
    environment?: IfoodEnvironment;
  }): Promise<{ categories: IfoodCategory[]; products: IfoodProduct[] }> {
    const env = resolveEnvironment(input.environment);
    const token = await this.auth.getAccessToken(input.organizationId, env);

    const [categories, products] = await Promise.all([
      this.client.request<IfoodCategory[]>({
        path: `/catalog/v1.0/categories`,
        query: { merchantId: input.merchantId },
        bearerToken: token,
      }),
      this.client.request<IfoodProduct[]>({
        path: `/catalog/v1.0/products`,
        query: { merchantId: input.merchantId },
        bearerToken: token,
      }),
    ]);

    return { categories, products };
  }

  async updatePrice(input: {
    organizationId: string;
    ifoodProductId: string;
    newPrice: number;
    environment?: IfoodEnvironment;
  }): Promise<void> {
    const env = resolveEnvironment(input.environment);
    const token = await this.auth.getAccessToken(input.organizationId, env);

    await this.client.request<void>({
      path: `/catalog/v1.0/products/${encodeURIComponent(input.ifoodProductId)}/price`,
      method: 'PATCH',
      body: { price: input.newPrice },
      bearerToken: token,
    });
  }

  async updateAvailability(input: {
    organizationId: string;
    ifoodProductId: string;
    active: boolean;
    environment?: IfoodEnvironment;
  }): Promise<void> {
    const env = resolveEnvironment(input.environment);
    const token = await this.auth.getAccessToken(input.organizationId, env);

    await this.client.request<void>({
      path: `/catalog/v1.0/products/${encodeURIComponent(input.ifoodProductId)}/status`,
      method: 'PATCH',
      body: { active: input.active },
      bearerToken: token,
    });
  }

  async syncCatalog(input: {
    organizationId: string;
    merchantId: string;
    actorUserId: string;
    environment?: IfoodEnvironment;
  }): Promise<{ categoriesSynced: number; productsSynced: number }> {
    const env = resolveEnvironment(input.environment);
    const token = await this.auth.getAccessToken(input.organizationId, env);

    const { categories, products } = await this.getCatalog({
      organizationId: input.organizationId,
      merchantId: input.merchantId,
      environment: env,
    });

    for (const cat of categories) {
      await categoryRepo.upsertFromIfood({
        organizationId: input.organizationId,
        merchantId: input.merchantId,
        ifoodCategoryId: cat.id,
        name: cat.name,
        position: cat.position ?? null,
        active: cat.active ?? true,
      });
    }

    for (const prod of products) {
      await productRepo.upsertFromIfood({
        organizationId: input.organizationId,
        merchantId: input.merchantId,
        categoryId: (await categoryRepo.findIdByIfoodId(input.organizationId, prod.categoryId)) ?? '',
        ifoodProductId: prod.id,
        name: prod.name,
        description: prod.description ?? null,
        active: prod.active ?? true,
      });
    }

    return {
      categoriesSynced: categories.length,
      productsSynced: products.length,
    };
  }
}
