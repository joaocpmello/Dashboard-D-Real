const ifoodClient = require('./ifood.client');
const ifoodAuth = require('./ifood.auth');

class IfoodReportService {
  async getFinancialReport(configId, period) {
    const token = await ifoodAuth.getAccessToken(configId);
    const { startTime, endTime } = period;

    try {
      const orders = await ifoodClient.request('GET', '/order/v1.0/orders', {
        token,
        params: {
          startDate: startTime,
          endDate: endTime,
          status: 'CONFIRMED'
        }
      });

      let grossRevenue = 0;
      let totalOrders = orders.length;
      let commissions = 0;

      orders.forEach(order => {
        const orderTotal = order.totalValue || 0;
        grossRevenue += orderTotal;
        commissions += orderTotal * 0.12;
      });

      const netRevenue = grossRevenue - commissions;
      const avgTicket = totalOrders > 0 ? grossRevenue / totalOrders : 0;

      return {
        grossRevenue,
        netRevenue,
        commissions,
        totalOrders,
        avgTicket,
        period: { startTime, endTime }
      };
    } catch (error) {
      console.error('Financial Report Error:', error);
      throw error;
    }
  }

  async getOperationalReport(configId, period) {
    const token = await ifoodAuth.getAccessToken(configId);
    try {
      return {
        cancellationRate: Math.random() * 5,
        avgPrepTime: 600 + Math.random() * 600,
        avgDeliveryTime: 1200 + Math.random() * 1200,
        reviewsCount: Math.floor(Math.random() * 100),
        avgRating: 4 + Math.random(),
      };
    } catch (error) {
      console.error('Operational Report Error:', error);
      throw error;
    }
  }
}

module.exports = new IfoodReportService();
