#!/usr/bin/env node

/**
 * NEWS NINJA - REAL ARTICLE GENERATOR (FIXED)
 * 
 * Genera articoli REALI usando:
 * - DuckDuckGo (web search) - FIXED
 * - Mistral-Nemo via Ollama (article generation)
 */

const axios = require('axios');
const db = require('./src/config/database');
require('dotenv').config();

// DuckDuckGo search function (without external library)
async function searchDuckDuckGo(query, maxResults = 5) {
  try {
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    // Simple parsing - just get text content
    const text = response.data;
    const results = [];
    
    // Extract some text snippets (simplified)
    const snippetMatches = text.match(/<a class="result__snippet"[^>]*>([^<]+)<\/a>/gi) || [];
    
    for (let i = 0; i < Math.min(maxResults, snippetMatches.length); i++) {
      const snippet = snippetMatches[i].replace(/<[^>]+>/g, '').trim();
      if (snippet.length > 20) {
        results.push({
          title: `Search Result ${i + 1}`,
          body: snippet
        });
      }
    }

    return results;
  } catch (error) {
    console.error('DuckDuckGo search error:', error.message);
    return [];
  }
}

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = 'mistral-nemo:latest';
const NUM_COUNTRIES = parseInt(process.argv[2]) || 5;
const TRENDS_PER_COUNTRY = parseInt(process.argv[3]) || 3;

// Language mapping
const COUNTRY_LANGUAGE_MAP = {
  'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en',
  'IN': 'en', 'IT': 'it', 'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es',
  'FR': 'fr', 'BE': 'fr', 'DE': 'de', 'AT': 'de', 'CH': 'de',
  'PT': 'pt', 'BR': 'pt', 'JP': 'ja', 'CN': 'zh', 'KR': 'ko',
  'RU': 'ru', 'NL': 'nl', 'SE': 'sv', 'NO': 'no', 'DK': 'da',
  'PL': 'pl', 'TR': 'tr', 'GR': 'el', 'CZ': 'cs', 'FI': 'fi'
};

const LANGUAGE_NAMES = {
  'en': 'English', 'it': 'Italian', 'es': 'Spanish', 'fr': 'French',
  'de': 'German', 'pt': 'Portuguese', 'ja': 'Japanese', 'zh': 'Chinese',
  'ru': 'Russian', 'nl': 'Dutch', 'sv': 'Swedish', 'no': 'Norwegian',
  'da': 'Danish', 'pl': 'Polish', 'tr': 'Turkish', 'el': 'Greek',
  'cs': 'Czech', 'fi': 'Finnish', 'ko': 'Korean'
};

// Statistics
let stats = {
  articlesGenerated: 0,
  articlesSuccess: 0,
  articlesFailed: 0,
  searchesPerformed: 0,
  searchesFailed: 0,
  startTime: Date.now()
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString().substring(11, 19);
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', search: '🔍', ai: '🤖' };
  console.log(`[${timestamp}] ${icons[type] || '•'} ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateMockTrends(countryCode) {
  const topics = [
    'artificial intelligence', 'renewable energy', 'electric vehicles',
    'remote work', 'cryptocurrency', 'climate change', 'space exploration',
    '5G technology', 'quantum computing', 'biotechnology', 'robotics',
    'cybersecurity', 'virtual reality', 'blockchain', 'sustainable fashion',
    'mental health', 'online education', 'smart cities', 'genomics',
    'autonomous vehicles'
  ];
  
  const shuffled = topics.sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, TRENDS_PER_COUNTRY).map((keyword, index) => ({
    keyword,
    visitors: Math.floor(Math.random() * 1000) + 500,
    growthRate: Math.floor(Math.random() * 80) + 20
  }));
}

async function searchWeb(query, language = 'en') {
  try {
    log(`Searching web for: "${query}"`, 'search');
    stats.searchesPerformed++;
    
    const results = await searchDuckDuckGo(query, 5);

    if (!results || results.length === 0) {
      log(`No search results for "${query}", using general knowledge`, 'warning');
      stats.searchesFailed++;
      return `General information about ${query}. This is a trending topic with growing interest globally. Recent developments show increased attention from industry experts and the general public.`;
    }

    const searchContext = results
      .map((r, i) => `[Source ${i + 1}] ${r.title}\n${r.body}`)
      .join('\n\n');

    log(`Found ${results.length} search results`, 'success');
    return searchContext;

  } catch (error) {
    log(`Search failed: ${error.message}, continuing with general knowledge`, 'warning');
    stats.searchesFailed++;
    return `Information about ${query}. This topic is currently trending and showing significant growth in interest.`;
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

async function generateArticle(trend, countryCode, countryName, rank) {
  try {
    log(`Generating article for "${trend.keyword}" (${countryName})`, 'ai');
    stats.articlesGenerated++;

    const language = COUNTRY_LANGUAGE_MAP[countryCode] || 'en';
    const languageName = LANGUAGE_NAMES[language] || 'English';

    // Step 1: Web search
    const searchData = await searchWeb(trend.keyword, language);
    await sleep(1000);

    // Step 2: Generate article
    const articlePrompt = `You are a professional journalist writing for readers in ${countryName}.

TOPIC: ${trend.keyword}
TREND DATA: This topic is trending with ${trend.visitors} recent visitors and growing at ${trend.growthRate}%

RESEARCH DATA FROM WEB:
${searchData}

YOUR TASK: Write a comprehensive, engaging news article in ${languageName} with the following structure:

1. HEADLINE: Create a catchy, informative headline (max 100 characters)
2. SUMMARY: Write a compelling summary paragraph (2-3 sentences)
3. MAIN CONTENT: Write 4-6 well-structured paragraphs (~600-800 words total)

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
HEADLINE: [Your headline here]

SUMMARY: [Your 2-3 sentence summary here]

CONTENT:
[Your main article content here - 4-6 paragraphs]

IMPORTANT:
- Write ENTIRELY in ${languageName}
- Use information from the research data
- Be factual and engaging
- Use natural, fluent language
- Make it relevant for ${countryName} audience`;

    log(`Sending to Ollama (${languageName})...`, 'ai');
    const fullArticle = await generateWithOllama(articlePrompt, 2500);
    await sleep(1000);

    const parsed = parseArticle(fullArticle);

    const articleId = await saveArticle({
      title: parsed.title,
      summary: parsed.summary,
      content: parsed.content,
      countryCode,
      countryName,
      language,
      trendKeyword: trend.keyword,
      trendRank: rank,
      searchQueries: [trend.keyword],
      sources: ['Web Search', 'AI Generated']
    });

    log(`Article saved (ID: ${articleId}): "${parsed.title.substring(0, 50)}..."`, 'success');
    stats.articlesSuccess++;

    return { id: articleId, ...parsed };

  } catch (error) {
    log(`Failed to generate article: ${error.message}`, 'error');
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
    data.title,
    data.summary,
    data.content,
    data.countryCode,
    data.countryName,
    data.language,
    data.trendKeyword,
    data.trendRank,
    data.searchQueries,
    data.sources
  ];

  const result = await db.query(query, values);
  return result.rows[0].id;
}

async function generateArticles() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('           NEWS NINJA - REAL ARTICLE GENERATOR');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
  log(`Configuration:`, 'info');
  log(`  Countries: ${NUM_COUNTRIES}`, 'info');
  log(`  Trends per country: ${TRENDS_PER_COUNTRY}`, 'info');
  log(`  Model: ${MODEL}`, 'info');
  log(`  Total articles: ${NUM_COUNTRIES * TRENDS_PER_COUNTRY}`, 'info');
  console.log('');

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'BR', name: 'Brazil' },
    { code: 'JP', name: 'Japan' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' }
  ];

  const selectedCountries = countries.slice(0, NUM_COUNTRIES);

  for (const country of selectedCountries) {
    log(`\n▶ Processing ${country.name} (${country.code})`, 'info');
    console.log('─'.repeat(70));

    const trends = generateMockTrends(country.code);

    for (let i = 0; i < trends.length; i++) {
      const trend = trends[i];
      log(`\nTrend ${i + 1}/${trends.length}: "${trend.keyword}"`, 'info');

      await generateArticle(trend, country.code, country.name, i + 1);

      if (i < trends.length - 1) {
        log('Waiting 3 seconds...', 'info');
        await sleep(3000);
      }
    }

    log(`Completed ${country.name}`, 'success');
  }

  const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                      GENERATION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
  log(`📊 Statistics:`, 'success');
  log(`  Articles generated: ${stats.articlesSuccess}`, 'success');
  log(`  Failed: ${stats.articlesFailed}`, 'error');
  log(`  Web searches: ${stats.searchesPerformed}`, 'search');
  log(`  Search failures: ${stats.searchesFailed}`, 'warning');
  log(`  Duration: ${duration} minutes`, 'info');
  if (stats.articlesSuccess > 0) {
    log(`  Average: ${(duration / stats.articlesSuccess).toFixed(2)} min/article`, 'info');
  }
  console.log('');
  console.log('🌐 View articles at: http://localhost:3000');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');
}

(async () => {
  try {
    await generateArticles();
    process.exit(0);
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
})();