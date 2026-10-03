const axios = require('axios');

class IfoodClient {
  constructor() {
    this.baseUrl = process.env.IFOOD_API_URL || 'https://merchant-api.ifood.com.br';
  }

  async request(method, endpoint, { token, data, params } = {}) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        data,
        params,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw {
          status: error.response.status,
          data: error.response.data,
          message: error.response.data.message || 'iFood API Error',
        };
      }
      throw error;
    }
  }
}

module.exports = new IfoodClient();
