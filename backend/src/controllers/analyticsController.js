const db = require('../config/database');

class AnalyticsController {
  // Track article view with geolocation
  async trackView(req, res) {
    try {
      const { articleId } = req.params;
      const { country, countryCode } = req.body;

      // Get visitor's country from IP if not provided
      let viewerCountry = country || 'Unknown';
      let viewerCountryCode = countryCode || 'XX';

      // If not provided, try to get from request headers (Cloudflare, AWS, etc.)
      if (viewerCountry === 'Unknown') {
        viewerCountryCode = req.headers['cf-ipcountry'] || 
                           req.headers['x-country-code'] || 
                           'XX';
      }

      // Insert view record
      await db.query(
        `INSERT INTO article_views (article_id, viewer_country, viewer_country_code, viewed_at)
         VALUES ($1, $2, $3, NOW())`,
        [articleId, viewerCountry, viewerCountryCode]
      );

      // Update article views count
      const result = await db.query(
        `UPDATE articles 
         SET views = views + 1 
         WHERE id = $1 
         RETURNING views`,
        [articleId]
      );

      res.json({ 
        success: true, 
        views: result.rows[0]?.views || 0 
      });
    } catch (error) {
      console.error('Error tracking view:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get top articles by views
  async getTopArticles(req, res) {
    try {
      const { limit = 10 } = req.query;

      const result = await db.query(
        `SELECT id, title, country_name, country_code, views, trend_keyword
         FROM articles
         WHERE status = 'published'
         ORDER BY views DESC
         LIMIT $1`,
        [parseInt(limit)]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting top articles:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get top articles by country (viewer location)
  async getTopArticlesByViewerCountry(req, res) {
    try {
      const { countryCode, limit = 5 } = req.query;

      const result = await db.query(
        `SELECT 
           a.id, a.title, a.country_name, a.views,
           COUNT(av.id) as country_views
         FROM articles a
         LEFT JOIN article_views av ON a.id = av.article_id
         WHERE av.viewer_country_code = $1
           AND a.status = 'published'
         GROUP BY a.id
         ORDER BY country_views DESC
         LIMIT $2`,
        [countryCode, parseInt(limit)]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting articles by viewer country:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get trending topics globally
  async getGlobalTrendingTopics(req, res) {
    try {
      const { limit = 5 } = req.query;

      const result = await db.query(
        `SELECT 
           trend_keyword,
           COUNT(DISTINCT id) as article_count,
           SUM(views) as total_views
         FROM articles
         WHERE status = 'published'
         GROUP BY trend_keyword
         ORDER BY total_views DESC
         LIMIT $1`,
        [parseInt(limit)]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting global trending topics:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get trending topics by country (article origin)
  async getTrendingTopicsByCountry(req, res) {
    try {
      const { countryCode, limit = 5 } = req.query;

      const result = await db.query(
        `SELECT 
           trend_keyword,
           COUNT(DISTINCT id) as article_count,
           SUM(views) as total_views,
           AVG(trend_rank) as avg_rank
         FROM articles
         WHERE country_code = $1
           AND status = 'published'
         GROUP BY trend_keyword
         ORDER BY total_views DESC
         LIMIT $2`,
        [countryCode, parseInt(limit)]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting trending topics by country:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get views by country (geo distribution)
  async getViewsByCountry(req, res) {
    try {
      const result = await db.query(
        `SELECT 
           viewer_country_code,
           viewer_country,
           COUNT(*) as view_count
         FROM article_views
         WHERE viewer_country_code != 'XX'
         GROUP BY viewer_country_code, viewer_country
         ORDER BY view_count DESC
         LIMIT 20`
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting views by country:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AnalyticsController();
