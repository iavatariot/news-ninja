#!/usr/bin/env node

/**
 * Add mock views to existing articles for testing analytics
 */

const db = require('./src/config/database');

const countries = [
  { name: 'Italy', code: 'IT' },
  { name: 'United States', code: 'US' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'France', code: 'FR' },
  { name: 'Germany', code: 'DE' },
  { name: 'Spain', code: 'ES' },
  { name: 'Japan', code: 'JP' },
  { name: 'China', code: 'CN' },
  { name: 'India', code: 'IN' },
  { name: 'Brazil', code: 'BR' },
];

async function addMockViews() {
  console.log('🎲 Adding mock views to articles...\n');

  try {
    // Get all articles
    const articles = await db.query('SELECT id FROM articles ORDER BY id');
    
    if (articles.rows.length === 0) {
      console.log('❌ No articles found. Generate articles first!');
      process.exit(1);
    }

    console.log(`Found ${articles.rows.length} articles\n`);

    let totalViews = 0;

    for (const article of articles.rows) {
      // Random views between 10 and 100
      const viewCount = Math.floor(Math.random() * 90) + 10;
      
      for (let i = 0; i < viewCount; i++) {
        // Random country
        const country = countries[Math.floor(Math.random() * countries.length)];
        
        // Random timestamp in last 7 days
        const daysAgo = Math.floor(Math.random() * 7);
        const hoursAgo = Math.floor(Math.random() * 24);
        
        await db.query(
          `INSERT INTO article_views (article_id, viewer_country, viewer_country_code, viewed_at)
           VALUES ($1, $2, $3, NOW() - INTERVAL '${daysAgo} days ${hoursAgo} hours')`,
          [article.id, country.name, country.code]
        );
      }

      // Update article views count
      await db.query(
        'UPDATE articles SET views = $1 WHERE id = $2',
        [viewCount, article.id]
      );

      totalViews += viewCount;
      console.log(`✅ Article ${article.id}: ${viewCount} views added`);
    }

    console.log(`\n🎉 Complete! Total ${totalViews} views added to ${articles.rows.length} articles`);
    console.log('\n📊 Now you can see data at: http://localhost:3000/trends');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

addMockViews();
