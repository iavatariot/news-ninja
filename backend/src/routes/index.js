const express = require('express');
const router = express.Router();
const articlesController = require('../controllers/articlesController');
const db = require('../config/database');

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'News Ninja API is running' });
});

// Articles routes
router.get('/articles', articlesController.getRecentArticles);
router.get('/articles/:id', articlesController.getArticleById);
router.post('/articles/generate', articlesController.generateCustomArticle);

// Trends routes
router.get('/trends/countries', async (req, res) => {
  try {
    const query = `
      SELECT 
        country_name,
        country_code,
        COUNT(*) as article_count,
        SUM(views) as total_views
      FROM articles
      WHERE status = 'published'
      GROUP BY country_code, country_name
      ORDER BY article_count DESC
    `;
    
    const result = await db.query(query);
    
    // Format data to match Plausible API structure
    const formattedData = result.rows.map(row => ({
      dimensions: [row.country_name, row.country_code],
      metrics: [parseInt(row.total_views || 0)]
    }));
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/trends/country/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    const query = `
      SELECT 
        trend_keyword as keyword,
        COUNT(*) as visitors,
        AVG(CAST(trend_rank as DECIMAL)) as avg_rank,
        50.0 as growth_rate
      FROM articles
      WHERE country_code = $1
        AND status = 'published'
      GROUP BY trend_keyword
      ORDER BY visitors DESC
      LIMIT 10
    `;
    
    const result = await db.query(query, [code]);
    
    const trends = result.rows.map((row, index) => ({
      keyword: row.keyword,
      visitors: parseInt(row.visitors),
      growthRate: parseFloat(row.growth_rate || 50)
    }));
    
    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

// Analytics routes
const analyticsController = require('../controllers/analyticsController');

router.post('/analytics/track/:articleId', analyticsController.trackView);
router.get('/analytics/top-articles', analyticsController.getTopArticles);
router.get('/analytics/top-by-viewer-country', analyticsController.getTopArticlesByViewerCountry);
router.get('/analytics/global-trending', analyticsController.getGlobalTrendingTopics);
router.get('/analytics/trending-by-country', analyticsController.getTrendingTopicsByCountry);
router.get('/analytics/views-by-country', analyticsController.getViewsByCountry);
