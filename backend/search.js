#!/usr/bin/env node

/**
 * NEWS NINJA - ARTICLE GENERATOR WITH SERPAPI GOOGLE TRENDS
 * 
 * Uses:
 * 1. SerpAPI - Get REAL trending topics (100/month FREE)
 * 2. Google Custom Search - Research articles (100/day FREE)
 * 3. Ollama - Generate articles with remote GPU
 * 
 * Setup:
 * 1. Get SerpAPI key (FREE): https://serpapi.com/
 * 2. Add to .env: SERPAPI_KEY=your_key
 * 3. Run: node search.js 5 2
 */

const axios = require('axios');
const db = require('./src/config/database');
require('dotenv').config();

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://51.68.13.213:11434';
const SERPAPI_KEY = process.env.SERPAPI_KEY || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GOOGLE_CX = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
const MODEL = 'mistral-nemo:latest';
const NUM_COUNTRIES = parseInt(process.argv[2]) || 2;
const TRENDS_PER_COUNTRY = parseInt(process.argv[3]) || 2;
const USE_REAL_TRENDS = process.env.USE_REAL_TRENDS !== 'false';

// Country mapping for SerpAPI
const COUNTRIES = {
  'US': { name: 'United States', code: 'US', lang: 'en', serpapi: 'united_states' },
  'IT': { name: 'Italy', code: 'IT', lang: 'it', serpapi: 'italy' },
  'ES': { name: 'Spain', code: 'ES', lang: 'es', serpapi: 'spain' },
  'FR': { name: 'France', code: 'FR', lang: 'fr', serpapi: 'france' },
  'DE': { name: 'Germany', code: 'DE', lang: 'de', serpapi: 'germany' },
  'GB': { name: 'United Kingdom', code: 'GB', lang: 'en', serpapi: 'united_kingdom' },
  'BR': { name: 'Brazil', code: 'BR', lang: 'pt', serpapi: 'brazil' },
  'JP': { name: 'Japan', code: 'JP', lang: 'ja', serpapi: 'japan' },
  'CA': { name: 'Canada', code: 'CA', lang: 'en', serpapi: 'canada' },
  'AU': { name: 'Australia', code: 'AU', lang: 'en', serpapi: 'australia' },
  'MX': { name: 'Mexico', code: 'MX', lang: 'es', serpapi: 'mexico' },
  'IN': { name: 'India', code: 'IN', lang: 'en', serpapi: 'india' },
  'KR': { name: 'South Korea', code: 'KR', lang: 'ko', serpapi: 'south_korea' },
  'RU': { name: 'Russia', code: 'RU', lang: 'ru', serpapi: 'russia' },
  'CN': { name: 'China', code: 'CN', lang: 'zh', serpapi: 'china' },
  'NL': { name: 'Netherlands', code: 'NL', lang: 'nl', serpapi: 'netherlands' },
  'SE': { name: 'Sweden', code: 'SE', lang: 'sv', serpapi: 'sweden' },
  'PL': { name: 'Poland', code: 'PL', lang: 'pl', serpapi: 'poland' },
  'TR': { name: 'Turkey', code: 'TR', lang: 'tr', serpapi: 'turkey' },
  'AR': { name: 'Argentina', code: 'AR', lang: 'es', serpapi: 'argentina' }
};

const LANGUAGE_NAMES = {
  'en': 'English', 'it': 'Italian', 'es': 'Spanish', 'fr': 'French',
  'de': 'German', 'pt': 'Portuguese', 'ja': 'Japanese', 'zh': 'Chinese',
  'ru': 'Russian', 'ko': 'Korean', 'nl': 'Dutch', 'sv': 'Swedish',
  'pl': 'Polish', 'tr': 'Turkish'
};

// Statistics
let stats = {
  articlesGenerated: 0,
  articlesSuccess: 0,
  articlesFailed: 0,
  searchesPerformed: 0,
  searchesSuccess: 0,
  searchesFailed: 0,
  trendsReal: 0,
  trendsMock: 0,
  serpApiCalls: 0,
  serpApiQuota: 100, // Free tier
  startTime: Date.now()
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substring(11, 19);
  const icons = { 
    info: 'ℹ️', success: '✅', error: '❌', 
    warning: '⚠️', search: '🔍', ai: '🤖', trends: '🔥', api: '🌐'
  };
  console.log(`[${timestamp}] ${icons[type] || '•'} ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get real trending topics from SerpAPI
async function getRealTrendsFromSerpAPI(countryCode) {
  if (!USE_REAL_TRENDS || !SERPAPI_KEY) {
    return null;
  }

  try {
    const country = COUNTRIES[countryCode];
    if (!country) {
      log(`Country ${countryCode} not supported by SerpAPI`, 'warning');
      return null;
    }

    log(`Fetching real trends for ${country.name} via SerpAPI...`, 'api');
    stats.serpApiCalls++;

    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_trends_trending_now',
        frequency: 'daily',
        geo: country.code,
        api_key: SERPAPI_KEY
      },
      timeout: 15000
    });

    if (response.data && response.data.daily_searches) {
      const trends = response.data.daily_searches
        .slice(0, 20) // Get top 20
        .map(item => ({
          keyword: item.query,
          searches: item.searches ? parseInt(item.searches.replace(/[^0-9]/g, '')) : 10000,
          isReal: true
        }));

      if (trends.length > 0) {
        stats.trendsReal += trends.length;
        stats.serpApiQuota--;
        log(`✅ Found ${trends.length} real trends for ${country.name} (Quota: ${stats.serpApiQuota}/100)`, 'success');
        return trends;
      }
    }

    // Try alternative endpoint
    log(`Trying alternative SerpAPI endpoint...`, 'api');
    const altResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_trends',
        q: 'trending',
        geo: country.code,
        api_key: SERPAPI_KEY
      },
      timeout: 15000
    });

    if (altResponse.data && altResponse.data.related_queries) {
      const trends = altResponse.data.related_queries.rising
        .slice(0, 20)
        .map(item => ({
          keyword: item.query,
          searches: item.value || 10000,
          isReal: true
        }));

      if (trends.length > 0) {
        stats.trendsReal += trends.length;
        stats.serpApiQuota--;
        log(`✅ Found ${trends.length} trending queries for ${country.name}`, 'success');
        return trends;
      }
    }

    log(`No trends found via SerpAPI for ${country.name}`, 'warning');
    return null;

  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        log(`❌ SerpAPI: Invalid API key`, 'error');
      } else if (error.response.status === 429) {
        log(`❌ SerpAPI: Quota exceeded (100/month limit)`, 'error');
      } else {
        log(`SerpAPI error: ${error.response.status}`, 'warning');
      }
    } else {
      log(`SerpAPI error: ${error.message}`, 'warning');
    }
    return null;
  }
}

// Fallback: Generate diverse mock trends
function generateMockTrends(countryCode) {
  const topicsByCategory = {
    tech: [
      'artificial intelligence 2024', 'ChatGPT updates', 'iPhone 16 pro',
      'machine learning trends', 'quantum computing news', 'cybersecurity threats',
      '5G technology', 'blockchain applications', 'metaverse development',
      'cloud computing trends', 'edge computing', 'IoT devices 2024'
    ],
    news: [
      'world news today', 'breaking news', 'politics 2024',
      'economy news', 'inflation rates', 'stock market trends',
      'climate change news', 'international relations', 'global events'
    ],
    business: [
      'startup funding', 'cryptocurrency news', 'Bitcoin price',
      'real estate market', 'investment opportunities', 'business trends',
      'remote work', 'digital transformation', 'sustainable business'
    ],
    lifestyle: [
      'healthy recipes', 'fitness trends', 'yoga benefits',
      'mental health', 'work life balance', 'productivity tips',
      'sustainable living', 'minimalism', 'wellness trends'
    ],
    entertainment: [
      'new movies 2024', 'streaming shows', 'Netflix series',
      'music festivals', 'celebrity news', 'gaming news',
      'esports tournaments', 'viral videos', 'social media trends'
    ],
    sports: [
      'champions league', 'world cup', 'formula 1',
      'olympics 2024', 'tennis tournaments', 'football news',
      'basketball scores', 'sports betting', 'fitness competitions'
    ],
    travel: [
      'travel destinations 2024', 'budget travel', 'luxury hotels',
      'backpacking tips', 'cruise vacations', 'adventure travel',
      'eco tourism', 'digital nomad', 'travel insurance'
    ],
    food: [
      'vegan recipes', 'meal prep ideas', 'cooking trends',
      'restaurant reviews', 'food delivery', 'healthy eating',
      'international cuisine', 'baking recipes', 'food photography'
    ]
  };

  // Combine all topics
  const allTopics = Object.values(topicsByCategory).flat();
  const shuffled = allTopics.sort(() => 0.5 - Math.random());
  
  stats.trendsMock += TRENDS_PER_COUNTRY;
  
  return shuffled.slice(0, TRENDS_PER_COUNTRY).map(keyword => ({
    keyword,
    searches: Math.floor(Math.random() * 5000) + 1000,
    growthRate: Math.floor(Math.random() * 80) + 20,
    isReal: false
  }));
}

// Get trends (real or mock)
async function getTrends(countryCode) {
  // Try SerpAPI first
  const realTrends = await getRealTrendsFromSerpAPI(countryCode);
  
  if (realTrends && realTrends.length > 0) {
    // Shuffle and select requested number
    const shuffled = realTrends.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, TRENDS_PER_COUNTRY).map((trend, index) => ({
      keyword: trend.keyword,
      searches: trend.searches,
      growthRate: Math.floor(Math.random() * 100) + 50,
      isReal: true,
      rank: index + 1
    }));
  }
  
  // Fallback to mock trends
  log(`Using diverse mock trends for ${countryCode}`, 'warning');
  return generateMockTrends(countryCode);
}

// Google Custom Search
async function searchGoogle(query, language = 'en') {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    return null;
  }

  try {
    log(`Google Search: "${query}" (${language})`, 'search');
    stats.searchesPerformed++;
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CX,
        q: query,
        num: 5,
        lr: `lang_${language}`,
        dateRestrict: 'w2' // Last 2 weeks for freshness
      },
      timeout: 10000
    });

    if (!response.data.items || response.data.items.length === 0) {
      stats.searchesFailed++;
      return null;
    }

    const results = response.data.items.slice(0, 5);
    const searchContext = results
      .map((r, i) => `[Source ${i + 1}] ${r.title}\n${r.snippet}`)
      .join('\n\n');

    stats.searchesSuccess++;
    log(`✅ Found ${results.length} results`, 'success');
    
    return searchContext;

  } catch (error) {
    stats.searchesFailed++;
    if (error.response?.status === 429) {
      log(`Google Search quota exceeded`, 'warning');
    }
    return null;
  }
}

async function generateWithOllama(prompt, maxTokens = 2000) {
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: maxTokens
        }
      },
      { timeout: 120000 }
    );
    return response.data.response;
  } catch (error) {
    log(`Ollama error: ${error.message}`, 'error');
    throw error;
  }
}

async function generateArticle(trend, country, rank) {
  try {
    const trendIndicator = trend.isReal ? '🔥 TRENDING NOW' : '📌 TOPIC';
    log(`\n${trendIndicator}: "${trend.keyword}" (${country.name})`, 'ai');
    stats.articlesGenerated++;

    // Step 1: Google Search for context
    const searchData = await searchGoogle(trend.keyword, country.lang);
    await sleep(1000);

    let researchInfo;
    if (searchData) {
      researchInfo = `REAL WEB RESEARCH FROM GOOGLE:\n${searchData}`;
    } else {
      researchInfo = `TRENDING TOPIC: ${trend.keyword}\n${trend.isReal ? '🔥 Currently TRENDING on Google!' : 'Popular topic'}\nUse your knowledge base.`;
    }

    // Step 2: Generate with Ollama
    const articlePrompt = `You are a professional journalist writing for ${country.name}.

${trend.isReal ? '🔥 THIS IS TRENDING RIGHT NOW ON GOOGLE!' : ''}
TOPIC: ${trend.keyword}
TREND DATA: ${trend.searches ? `${trend.searches.toLocaleString()} searches` : 'Trending topic'}, High engagement

${researchInfo}

Write a comprehensive, engaging news article in ${LANGUAGE_NAMES[country.lang] || 'English'}:

FORMAT:
HEADLINE: [Catchy, SEO-optimized headline about "${trend.keyword}", max 100 characters]

SUMMARY: [2-3 compelling sentences that hook the reader]

CONTENT:
[Write 4-6 well-structured paragraphs totaling 600-800 words. Make it engaging, informative, and professional.]

REQUIREMENTS:
- Write ENTIRELY in ${LANGUAGE_NAMES[country.lang] || 'English'}
- ${trend.isReal ? 'This is TRENDING NOW - make it timely, urgent, and relevant!' : 'Make it informative and engaging'}
- Use web research information if provided
- Natural, journalistic writing style
- Relevant for ${country.name} audience
- Include specific details and facts`;

    log(`Ollama generating (${LANGUAGE_NAMES[country.lang]})...`, 'ai');
    const fullArticle = await generateWithOllama(articlePrompt, 2500);
    await sleep(1000);

    const parsed = parseArticle(fullArticle);

    // Step 3: Save to database
    const articleId = await saveArticle({
      title: parsed.title,
      summary: parsed.summary,
      content: parsed.content,
      countryCode: country.code,
      countryName: country.name,
      language: country.lang,
      trendKeyword: trend.keyword,
      trendRank: rank,
      searchQueries: [trend.keyword],
      sources: trend.isReal 
        ? ['SerpAPI Google Trends', 'Google Search', 'AI Generated']
        : ['Mock Trends', 'AI Generated']
    });

    const icon = trend.isReal ? '🔥' : '📌';
    const searchIcon = searchData ? '🔍✅' : '🤖';
    log(`${icon}${searchIcon} Saved (ID: ${articleId}): "${parsed.title.substring(0, 50)}..."`, 'success');
    stats.articlesSuccess++;

    return { id: articleId, ...parsed };

  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    stats.articlesFailed++;
    return null;
  }
}

function parseArticle(text) {
  const headlineMatch = text.match(/HEADLINE:\s*(.+?)(?:\n|$)/i);
  const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?:\n\n|CONTENT:)/is);
  const contentMatch = text.match(/CONTENT:\s*(.+)$/is);

  return {
    title: headlineMatch ? headlineMatch[1].trim() : 'Untitled Article',
    summary: summaryMatch ? summaryMatch[1].trim() : '',
    content: contentMatch ? contentMatch[1].trim() : text
  };
}

async function saveArticle(data) {
  const query = `
    INSERT INTO articles (
      title, summary, content, country_code, country_name,
      language, trend_keyword, trend_rank, search_queries, sources
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `;

  const values = [
    data.title, data.summary, data.content, data.countryCode, data.countryName,
    data.language, data.trendKeyword, data.trendRank, data.searchQueries, data.sources
  ];

  const result = await db.query(query, values);
  return result.rows[0].id;
}

async function main() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('       🔥 NEWS NINJA - SERPAPI GOOGLE TRENDS GENERATOR');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
  
  log(`Configuration:`, 'info');
  log(`  Countries: ${NUM_COUNTRIES}`, 'info');
  log(`  Trends per country: ${TRENDS_PER_COUNTRY}`, 'info');
  log(`  Model: ${MODEL}`, 'info');
  log(`  Ollama: ${OLLAMA_URL}`, 'info');
  log(`  SerpAPI: ${SERPAPI_KEY ? '✅ Configured' : '❌ Not configured'}`, SERPAPI_KEY ? 'success' : 'error');
  log(`  Google Search: ${GOOGLE_API_KEY ? '✅ Configured' : '⚠️ Optional'}`, GOOGLE_API_KEY ? 'success' : 'warning');
  log(`  Real Trends: ${USE_REAL_TRENDS ? '✅ ENABLED' : '❌ DISABLED'}`, USE_REAL_TRENDS ? 'success' : 'warning');
  log(`  Total articles: ${NUM_COUNTRIES * TRENDS_PER_COUNTRY}`, 'info');
  console.log('');

  if (!SERPAPI_KEY && USE_REAL_TRENDS) {
    log('⚠️  Warning: SERPAPI_KEY not found in .env', 'warning');
    log('   Get FREE API key: https://serpapi.com/', 'info');
    log('   Using mock trends as fallback...', 'warning');
    console.log('');
  }

  const selectedCountries = Object.values(COUNTRIES).slice(0, NUM_COUNTRIES);

  for (const country of selectedCountries) {
    log(`\n▶ Processing ${country.name} (${country.code})`, 'trends');
    console.log('─'.repeat(70));

    const trends = await getTrends(country.code);

    for (let i = 0; i < trends.length; i++) {
      const trend = trends[i];
      const trendType = trend.isReal ? '🔥 REAL TREND' : '📌 MOCK TOPIC';
      log(`${trendType} ${i + 1}/${trends.length}: "${trend.keyword}"`, 'info');

      await generateArticle(trend, country, i + 1);

      if (i < trends.length - 1) {
        log('Waiting 2 seconds...', 'info');
        await sleep(2000);
      }
    }

    log(`✅ Completed ${country.name}`, 'success');
    
    // Small delay between countries
    if (selectedCountries.indexOf(country) < selectedCountries.length - 1) {
      await sleep(3000);
    }
  }

  const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                     ✅ GENERATION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
  log(`📊 STATISTICS:`, 'success');
  log(`  ✅ Articles: ${stats.articlesSuccess} success, ${stats.articlesFailed} failed`, 'info');
  log(`  🔥 Real trends: ${stats.trendsReal}`, stats.trendsReal > 0 ? 'success' : 'warning');
  log(`  📌 Mock topics: ${stats.trendsMock}`, 'info');
  log(`  🌐 SerpAPI calls: ${stats.serpApiCalls} (${stats.serpApiQuota}/100 remaining)`, 'api');
  log(`  🔍 Google searches: ${stats.searchesPerformed} (${stats.searchesSuccess} success)`, 'info');
  log(`  ⏱️  Duration: ${duration} minutes`, 'info');
  if (stats.articlesSuccess > 0) {
    log(`  ⚡ Average: ${(duration / stats.articlesSuccess).toFixed(2)} min/article`, 'info');
  }
  console.log('');
  console.log('🌐 View articles at: http://localhost:3000');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
}

// Run
(async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
})();
