const axios = require('axios');
require('dotenv').config();

class PlausibleService {
  constructor() {
    this.baseUrl = process.env.PLAUSIBLE_URL;
    this.apiKey = process.env.PLAUSIBLE_API_KEY;
    this.siteId = process.env.PLAUSIBLE_SITE_ID;
  }

  async query(payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v2/query`,
        { site_id: this.siteId, ...payload },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Plausible API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getCountryTrends(days = 7) {
    const result = await this.query({
      metrics: ['visitors'],
      date_range: `${days}d`,
      dimensions: ['visit:country_name', 'visit:country'],
      order_by: [['visitors', 'desc']],
      limit: 1000
    });
    return result;
  }

  async getPageTrendsByCountry(countryCode, days = 7) {
    const result = await this.query({
      metrics: ['visitors', 'pageviews'],
      date_range: `${days}d`,
      dimensions: ['event:page'],
      filters: [
        ['is', 'visit:country', [countryCode]]
      ],
      order_by: [['visitors', 'desc']],
      limit: 10
    });
    return result;
  }

  async getGrowthTrendsByCountry(countryCode) {
    // Confronta ultimi 7 giorni con i 7 precedenti
    const current = await this.query({
      metrics: ['visitors'],
      date_range: '7d',
      dimensions: ['event:page'],
      filters: [['is', 'visit:country', [countryCode]]],
      order_by: [['visitors', 'desc']],
      limit: 50
    });

    const previous = await this.query({
      metrics: ['visitors'],
      date_range: 'custom',
      date_range_start: this.getDateDaysAgo(14),
      date_range_end: this.getDateDaysAgo(7),
      dimensions: ['event:page'],
      filters: [['is', 'visit:country', [countryCode]]],
      order_by: [['visitors', 'desc']],
      limit: 50
    });

    return this.calculateGrowth(current, previous);
  }

  calculateGrowth(current, previous) {
    const trends = [];
    const currentResults = current.results || [];
    const previousMap = new Map();

    // Mappa i risultati precedenti
    (previous.results || []).forEach(result => {
      const page = result.dimensions[0];
      const visitors = result.metrics[0];
      previousMap.set(page, visitors);
    });

    // Calcola crescita
    currentResults.forEach(result => {
      const page = result.dimensions[0];
      const currentVisitors = result.metrics[0];
      const previousVisitors = previousMap.get(page) || 0;

      const growthRate = previousVisitors > 0
        ? ((currentVisitors - previousVisitors) / previousVisitors) * 100
        : 100;

      if (growthRate > 0 || currentVisitors > 10) {
        trends.push({
          keyword: page.replace(/^\//, '').replace(/-/g, ' ') || 'homepage',
          visitors: currentVisitors,
          growthRate: parseFloat(growthRate.toFixed(2))
        });
      }
    });

    // Ordina per crescita
    return trends.sort((a, b) => b.growthRate - a.growthRate).slice(0, 10);
  }

  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
}

module.exports = new PlausibleService();
