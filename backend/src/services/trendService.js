const db = require('../config/database');
const plausibleService = require('./plausibleService');
const ollamaService = require('./ollamaService');

class TrendService {
  async analyzeAllCountries() {
    console.log('🔍 Starting global trend analysis...');

    try {
      // 1. Ottieni paesi con traffico
      const countryData = await plausibleService.getCountryTrends(7);
      const countries = countryData.results || [];

      console.log(`📊 Found ${countries.length} countries with traffic`);

      const allArticles = [];

      // 2. Analizza ogni paese
      for (const country of countries.slice(0, 20)) { // Limita a top 20 paesi
        const countryName = country.dimensions[0];
        const countryCode = country.dimensions[1];
        const visitors = country.metrics[0];

        if (visitors < 10) continue; // Skip paesi con poco traffico

        console.log(`\n🌍 Analyzing ${countryName} (${countryCode}) - ${visitors} visitors`);

        try {
          // 3. Ottieni trend in crescita per questo paese
          const trends = await plausibleService.getGrowthTrendsByCountry(countryCode);

          if (trends.length === 0) {
            console.log(`  ⚠️  No trends found for ${countryName}`);
            continue;
          }

          // 4. Salva trends nel database
          await this.saveTrends(countryCode, countryName, trends);

          // 5. Genera articoli per top 10 trends
          const topTrends = trends.slice(0, 10);
          console.log(`  📈 Processing ${topTrends.length} trends...`);

          for (let i = 0; i < topTrends.length; i++) {
            const trend = topTrends[i];
            console.log(`    ${i + 1}. ${trend.keyword} (+${trend.growthRate}%)`);

            try {
              const article = await this.generateArticleForTrend(
                trend,
                countryCode,
                countryName,
                i + 1
              );

              if (article) {
                allArticles.push(article);
                console.log(`    ✅ Article generated: "${article.title}"`);
              }
            } catch (error) {
              console.error(`    ❌ Failed to generate article: ${error.message}`);
            }

            // Pausa per non sovraccaricare Ollama
            await this.sleep(2000);
          }

        } catch (error) {
          console.error(`  ❌ Error analyzing ${countryName}:`, error.message);
        }

        // Pausa tra paesi
        await this.sleep(3000);
      }

      console.log(`\n✅ Analysis complete! Generated ${allArticles.length} articles`);
      return allArticles;

    } catch (error) {
      console.error('❌ Global analysis failed:', error);
      throw error;
    }
  }

  async generateArticleForTrend(trend, countryCode, countryName, rank) {
    const language = ollamaService.getLanguageForCountry(countryCode);

    // 1. Ricerca informazioni sul trend
    const searchData = await ollamaService.searchWeb(trend.keyword, language);

    // 2. Genera articolo
    const article = await ollamaService.writeArticle(
      trend,
      searchData,
      language,
      countryName
    );

    // 3. Salva nel database
    const articleId = await this.saveArticle({
      title: article.title,
      summary: article.summary,
      content: article.content,
      countryCode,
      countryName,
      language,
      trendKeyword: trend.keyword,
      trendRank: rank,
      searchQueries: [trend.keyword],
      sources: ['AI Generated', 'Web Research']
    });

    return { ...article, id: articleId, countryCode, language };
  }

  async saveArticle(articleData) {
    const query = `
      INSERT INTO articles (
        title, summary, content, country_code, country_name,
        language, trend_keyword, trend_rank, search_queries, sources
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const values = [
      articleData.title,
      articleData.summary,
      articleData.content,
      articleData.countryCode,
      articleData.countryName,
      articleData.language,
      articleData.trendKeyword,
      articleData.trendRank,
      articleData.searchQueries,
      articleData.sources
    ];

    const result = await db.query(query, values);
    return result.rows[0].id;
  }

  async saveTrends(countryCode, countryName, trends) {
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < trends.length; i++) {
      const trend = trends[i];

      const query = `
        INSERT INTO trends (
          country_code, country_name, keyword, rank,
          visitors, growth_rate, analyzed_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (country_code, keyword, analyzed_date)
        DO UPDATE SET
          rank = EXCLUDED.rank,
          visitors = EXCLUDED.visitors,
          growth_rate = EXCLUDED.growth_rate
      `;

      const values = [
        countryCode,
        countryName,
        trend.keyword,
        i + 1,
        trend.visitors,
        trend.growthRate,
        today
      ];

      await db.query(query, values);
    }
  }

  async getRecentArticles(limit = 20, countryCode = null) {
    let query = `
      SELECT * FROM articles
      WHERE status = 'published'
    `;

    const values = [];

    if (countryCode) {
      query += ` AND country_code = $1`;
      values.push(countryCode);
    }

    query += ` ORDER BY published_at DESC LIMIT $${values.length + 1}`;
    values.push(limit);

    const result = await db.query(query, values);
    return result.rows;
  }

  async getArticleById(id) {
    const query = 'SELECT * FROM articles WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  async incrementViews(id) {
    const query = 'UPDATE articles SET views = views + 1 WHERE id = $1';
    await db.query(query, [id]);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new TrendService();
