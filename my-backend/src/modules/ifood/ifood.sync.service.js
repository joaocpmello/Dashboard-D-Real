const ifoodClient = require('./ifood.client');
const ifoodAuth = require('./ifood.auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class IfoodSyncService {
  async syncMenu(configId) {
    const token = await ifoodAuth.getAccessToken(configId);

    try {
      // iFood Catalog API: Fetch categories and products
      // Note: Endpoint /catalog/v1.0/catalogs is the standard for full structure
      const catalogData = await ifoodClient.request('GET', '/catalog/v1.0/catalogs', {
        token,
      });

      // Assuming catalogData contains categories with items
      // Structure varies by API version, typically: { categories: [ { id, name, items: [...] } ] }
      const categories = catalogData.categories || [];

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
