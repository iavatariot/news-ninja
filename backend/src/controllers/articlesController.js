const db = require('../config/database');

class ArticlesController {
  async getRecentArticles(req, res) {
    try {
      const { limit = 20, country } = req.query;
      
      let query = `
        SELECT * FROM articles
        WHERE status = 'published'
      `;
      
      const values = [];
      
      if (country) {
        query += ` AND country_code = $1`;
        values.push(country);
      }
      
      query += ` ORDER BY published_at DESC LIMIT $${values.length + 1}`;
      values.push(parseInt(limit));
      
      const result = await db.query(query, values);
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getArticleById(req, res) {
    try {
      const { id } = req.params;
      
      const query = 'SELECT * FROM articles WHERE id = $1';
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Article not found' 
        });
      }

      // Incrementa visualizzazioni
      await db.query(
        'UPDATE articles SET views = views + 1 WHERE id = $1',
        [id]
      );

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async generateCustomArticle(req, res) {
    try {
      const { trends, countryCode, countryName } = req.body;

      if (!trends || trends.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No trends provided'
        });
      }

      // Per ora restituisce un articolo mock
      // TODO: Implementare generazione reale con Ollama
      const mockArticle = {
        title: `Custom Article about ${trends[0].keyword}`,
        summary: `This is a custom generated article about ${trends[0].keyword} for ${countryName}.`,
        content: `This article discusses the trending topic of ${trends[0].keyword}. 

The trend has been growing at ${trends[0].growthRate}% with ${trends[0].visitors} recent visitors showing interest.

This represents a significant shift in how people are engaging with this topic in ${countryName}.

More detailed analysis and insights would be generated here by the AI system.`,
        countryCode: countryCode,
        language: this.getLanguageForCountry(countryCode)
      };

      res.json({ success: true, data: mockArticle });
    } catch (error) {
      console.error('Error generating custom article:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  getLanguageForCountry(countryCode) {
    const map = {
      'IT': 'it', 'ES': 'es', 'FR': 'fr', 'DE': 'de', 'PT': 'pt',
      'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en'
    };
    return map[countryCode] || 'en';
  }
}

module.exports = new ArticlesController();
