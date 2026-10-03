const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class IfoodAuthService {
  async getAccessToken(configId) {
    const config = await prisma.ifoodConfig.findUnique({ where: { id: configId } });
    if (!config) throw new Error('iFood configuration not found');

    if (config.accessTokenCipher && config.accessTokenExpiresAt && config.accessTokenExpiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
      return config.accessTokenCipher;
    }

    try {
      const response = await axios.post('https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const { accessToken, expiresIn } = response.data;
      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      await prisma.ifoodConfig.update({
        where: { id: configId },
        data: {
          accessTokenCipher: accessToken,
          accessTokenExpiresAt: expiresAt,
        },
      });

      return accessToken;
    } catch (error) {
      console.error('iFood Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to refresh iFood access token');
    }
  }
}

module.exports = new IfoodAuthService();
