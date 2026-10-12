const ifoodClient = require('./ifood.client');
const ifoodAuth = require('./ifood.auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class IfoodSyncService {
  async syncMenu(configId) {
    const token = await ifoodAuth.getAccessToken(configId);
    const config = await prisma.ifoodConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      throw new Error('iFood Configuration not found');
    }

    try {
      // Updated to iFood Catalog API v2.0
      // Endpoint: GET /merchants/{merchantId}/categories?include_items=true
      const endpoint = `/merchants/${config.merchantId}/categories`;
      const categories = await ifoodClient.request('GET', endpoint, {
        token,
        params: { include_items: 'true' },
      });

      if (!Array.isArray(categories)) {
        throw new Error('Invalid response from iFood Catalog API');
      }

      for (const cat of categories) {
        // 1. Upsert Category
        await prisma.ifoodCategory.upsert({
          where: {
            id: cat.id,
          },
          update: {
            name: cat.name,
          },
          create: {
            id: cat.id,
            name: cat.name,
            configId: configId,
          },
        });

        // 2. Process Items in Category
        const items = cat.items || [];
        for (const item of items) {
          await prisma.ifoodProduct.upsert({
            where: {
              id: item.id,
            },
            update: {
              name: item.name,
              description: item.description,
              price: parseFloat(item.price) || 0,
              categoryId: cat.id,
              configId: configId,
            },
            create: {
              id: item.id,
              name: item.name,
              description: item.description,
              price: parseFloat(item.price) || 0,
              categoryId: cat.id,
              configId: configId,
            },
          });
        }
      }

      return {
        success: true,
        categoriesSynced: categories.length,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('iFood Menu Sync Error:', error);
      throw error;
    }
  }
}

module.exports = new IfoodSyncService();
