#!/usr/bin/env node

/**
 * NEWS NINJA - EXTENDED ARTICLE GENERATOR
 * 
 * Includes more countries: Russia, China, India, Japan, South Korea, etc.
 */

const axios = require('axios');
const db = require('./src/config/database');
require('dotenv').config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';
const GOOGLE_CX = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
const MODEL = 'mistral-nemo:latest';
const NUM_COUNTRIES = parseInt(process.argv[2]) || 5;
const TRENDS_PER_COUNTRY = parseInt(process.argv[3]) || 2;

// Extended country-language mapping
const COUNTRY_LANGUAGE_MAP = {
  // Western
  'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en',
  'IT': 'it', 'ES': 'es', 'FR': 'fr', 'DE': 'de', 'PT': 'pt',
  'NL': 'nl', 'BE': 'fr', 'CH': 'de', 'AT': 'de',
  // Latin America
  'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es', 'PE': 'es',
  'BR': 'pt',
  // Eastern Europe
  'RU': 'ru', 'PL': 'pl', 'UA': 'uk', 'CZ': 'cs', 'RO': 'ro',
  // Asia
  'CN': 'zh', 'JP': 'ja', 'KR': 'ko', 'IN': 'hi', 'ID': 'id',
  'TH': 'th', 'VN': 'vi', 'PH': 'en', 'MY': 'ms', 'SG': 'en',
  'TW': 'zh', 'HK': 'zh',
  // Middle East
  'TR': 'tr', 'SA': 'ar', 'AE': 'ar', 'IL': 'he', 'EG': 'ar',
  // Nordic
  'SE': 'sv', 'NO': 'no', 'DK': 'da', 'FI': 'fi',
  // Others
  'GR': 'el', 'ZA': 'en', 'NG': 'en', 'KE': 'en',
};

const LANGUAGE_NAMES = {
  'en': 'English', 'it': 'Italian', 'es': 'Spanish', 'fr': 'French',
  'de': 'German', 'pt': 'Portuguese', 'nl': 'Dutch',
  'ru': 'Russian', 'pl': 'Polish', 'uk': 'Ukrainian', 'cs': 'Czech', 'ro': 'Romanian',
  'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean', 'hi': 'Hindi', 'id': 'Indonesian',
  'th': 'Thai', 'vi': 'Vietnamese', 'ms': 'Malay',
  'tr': 'Turkish', 'ar': 'Arabic', 'he': 'Hebrew',
  'sv': 'Swedish', 'no': 'Norwegian', 'da': 'Danish', 'fi': 'Finnish',
  'el': 'Greek',
};

// Extended countries list
const COUNTRIES = [
  // Western
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PT', name: 'Portugal' },
  // Latin America
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  // Asia
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'PH', name: 'Philippines' },
  { code: 'SG', name: 'Singapore' },
  // Eastern Europe
  { code: 'RU', name: 'Russia' },
  { code: 'PL', name: 'Poland' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'CZ', name: 'Czech Republic' },
  // Middle East
  { code: 'TR', name: 'Turkey' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IL', name: 'Israel' },
  // Nordic
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  // Others
  { code: 'GR', name: 'Greece' },
  { code: 'ZA', name: 'South Africa' },
];

let stats = {
  articlesSuccess: 0,
  articlesFailed: 0,
  searchesSuccess: 0,
  searchesFailed: 0,
  startTime: Date.now(),
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
    'artificial intelligence 2025', 'renewable energy news', 'electric vehicles market',
    'remote work trends', 'cryptocurrency updates', 'climate change solutions',
    'space exploration news', '5G technology rollout', 'quantum computing advances',
    'biotechnology breakthroughs', 'robotics industry', 'cybersecurity threats',
    'virtual reality applications', 'blockchain technology', 'sustainable development',
    'mental health awareness', 'online education', 'smart cities technology',
    'medical research', 'autonomous vehicles', 'fintech innovation',
  ];
  
  return topics.sort(() => 0.5 - Math.random()).slice(0, TRENDS_PER_COUNTRY).map((keyword, index) => ({
    keyword,
    visitors: Math.floor(Math.random() * 1000) + 500,
    growthRate: Math.floor(Math.random() * 80) + 20
  }));
}

async function searchGoogle(query, language = 'en') {
  try {
    log(`Google Search: "${query}"`, 'search');
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CX,
        q: query,
        num: 5,
        lr: `lang_${language}`,
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
    log(`Search failed: ${error.message}`, 'warning');
    return null;
  }
}

async function generateWithOllama(prompt, maxTokens = 2000) {
  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model: MODEL,
    prompt: prompt,
    stream: false,
    options: { temperature: 0.7, top_p: 0.9, num_predict: maxTokens }
  }, { timeout: 120000 });
  return response.data.response;
}

async function generateArticle(trend, countryCode, countryName, rank) {
  try {
    log(`\nGenerating: "${trend.keyword}" (${countryName})`, 'ai');

    const language = COUNTRY_LANGUAGE_MAP[countryCode] || 'en';
    const languageName = LANGUAGE_NAMES[language] || 'English';

    const searchData = await searchGoogle(trend.keyword, language);
    await sleep(1000);

    const researchInfo = searchData
      ? `REAL WEB SEARCH RESULTS:\n${searchData}`
      : `TOPIC: ${trend.keyword}\nUse your knowledge base.`;

    const articlePrompt = `You are a professional journalist writing for ${countryName}.

TOPIC: ${trend.keyword}
TREND: ${trend.visitors} visitors, ${trend.growthRate}% growth

${researchInfo}

Write a comprehensive article in ${languageName}:

FORMAT:
HEADLINE: [Catchy headline, max 100 characters]

SUMMARY: [2-3 sentence summary]

CONTENT:
[4-6 paragraphs, 600-800 words]

REQUIREMENTS:
- Write ENTIRELY in ${languageName}
- Be factual and engaging
- Natural language for ${countryName}`;

    log(`Ollama generating (${languageName})...`, 'ai');
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
      sources: searchData ? ['Google Search', 'AI Generated'] : ['AI Generated']
    });

    stats.articlesSuccess++;
    log(`✅ Saved (ID: ${articleId})`, 'success');

    return articleId;
  } catch (error) {
    stats.articlesFailed++;
    log(`Failed: ${error.message}`, 'error');
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

  const result = await db.query(query, [
    data.title, data.summary, data.content, data.countryCode, data.countryName,
    data.language, data.trendKeyword, data.trendRank, data.searchQueries, data.sources
  ]);
  
  return result.rows[0].id;
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('       NEWS NINJA - EXTENDED ARTICLE GENERATOR');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  log(`Countries: ${NUM_COUNTRIES}`, 'info');
  log(`Trends per country: ${TRENDS_PER_COUNTRY}`, 'info');
  log(`Total articles: ${NUM_COUNTRIES * TRENDS_PER_COUNTRY}`, 'info');
  console.log('');

  const selectedCountries = COUNTRIES.slice(0, NUM_COUNTRIES);

  for (const country of selectedCountries) {
    log(`\n▶ Processing ${country.name} (${country.code})`, 'info');
    console.log('─'.repeat(70));

    const trends = generateMockTrends(country.code);

    for (let i = 0; i < trends.length; i++) {
      const trend = trends[i];
      log(`Trend ${i + 1}/${trends.length}: "${trend.keyword}"`, 'info');

      await generateArticle(trend, country.code, country.name, i + 1);

      if (i < trends.length - 1) {
        log('Waiting 2 seconds...', 'info');
        await sleep(2000);
      }
    }

    log(`✅ Completed ${country.name}`, 'success');
  }

  const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(2);

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('                     GENERATION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  log(`✅ Articles: ${stats.articlesSuccess} success, ${stats.articlesFailed} failed`, 'info');
  log(`🔍 Searches: ${stats.searchesSuccess} success, ${stats.searchesFailed} failed`, 'info');
  log(`⏱️  Duration: ${duration} minutes`, 'info');
  console.log('\n🌐 View at: http://localhost:3000\n');
}

main().then(() => process.exit(0)).catch(err => {
  log(`Fatal: ${err.message}`, 'error');
  process.exit(1);
});
