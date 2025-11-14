const axios = require('axios');
const { search } = require('duckduckgo-search');
require('dotenv').config();

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = 'mistral-nemo:latest';
  }

  async generate(prompt, options = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            num_predict: options.max_tokens || 2000,
          }
        },
        {
          timeout: 120000 // 2 minuti
        }
      );
      return response.data.response;
    } catch (error) {
      console.error('Ollama API Error:', error.message);
      throw new Error('Failed to generate content with Ollama');
    }
  }

  async searchWeb(query, language = 'en') {
    try {
      console.log(`🔍 Searching web for: "${query}"`);
      
      // Ricerca reale con DuckDuckGo
      const results = await search(query, {
        max_results: 5,
        region: this.getRegionForLanguage(language)
      });

      if (!results || results.length === 0) {
        console.log('⚠️  No search results found, using model knowledge');
        return await this.generate(
          `Provide accurate information about: "${query}" in ${language}`,
          { temperature: 0.5, max_tokens: 800 }
        );
      }

      // Estrarre contenuto utile dai risultati
      const searchContext = results
        .map((r, i) => `[Source ${i + 1}] ${r.title}\n${r.body}`)
        .join('\n\n');

      console.log(`✅ Found ${results.length} web search results`);

      // Far elaborare i risultati al modello
      const enhancedPrompt = `You are a professional researcher. Based on the following REAL web search results about "${query}", provide a comprehensive and accurate summary:

${searchContext}

Instructions:
1. Synthesize the information from ALL sources above
2. Highlight the most important and recent facts
3. Mention key statistics or data if present
4. Write in ${this.getLanguageName(language)}
5. Be factual and cite general findings from the sources
6. Keep it informative and well-structured (2-3 paragraphs)

Do not make up information. Only use what's in the search results above.`;

      const summary = await this.generate(enhancedPrompt, { 
        temperature: 0.5, 
        max_tokens: 1000 
      });

      return summary;

    } catch (error) {
      console.error('❌ Web search error:', error.message);
      // Fallback: usa conoscenza del modello
      console.log('⚠️  Falling back to model knowledge');
      return await this.generate(
        `Provide information about: "${query}" based on your knowledge. Write in ${this.getLanguageName(language)}.`,
        { temperature: 0.6, max_tokens: 800 }
      );
    }
  }

  async writeArticle(trend, searchData, language, countryName) {
    const languageName = this.getLanguageName(language);

    const articlePrompt = `You are a professional journalist writing for readers in ${countryName}.

TOPIC: ${trend.keyword}
TREND DATA: This topic is trending with ${trend.visitors} recent visitors and growing at ${trend.growthRate}%

RESEARCH DATA FROM WEB:
${searchData}

YOUR TASK: Write a comprehensive, engaging news article in ${languageName} with the following structure:

1. HEADLINE: Create a catchy, informative headline (max 100 characters)
2. SUMMARY: Write a compelling summary paragraph (2-3 sentences) that captures the essence
3. MAIN CONTENT: Write 4-6 well-structured paragraphs (~600-800 words total) that:
   - Explain what this trend is about
   - Include key facts from the research data
   - Explain why this matters to readers in ${countryName}
   - Provide relevant context and background
   - Use a professional, journalistic tone
   - Make it engaging and informative

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
HEADLINE: [Your headline here]

SUMMARY: [Your 2-3 sentence summary here]

CONTENT:
[Your main article content here - 4-6 paragraphs]

CRITICAL INSTRUCTIONS:
- Write ENTIRELY in ${languageName}
- Use information from the research data provided
- Be factual and accurate
- Use natural, fluent language
- Do not translate word-by-word, write naturally
- Make it engaging for ${countryName} audience`;

    const fullArticle = await this.generate(articlePrompt, {
      temperature: 0.7,
      max_tokens: 2500
    });

    return this.parseArticle(fullArticle);
  }

  parseArticle(text) {
    const headlineMatch = text.match(/HEADLINE:\s*(.+?)(?:\n|$)/i);
    const summaryMatch = text.match(/SUMMARY:\s*(.+?)(?:\n\n|CONTENT:)/is);
    const contentMatch = text.match(/CONTENT:\s*(.+)$/is);

    return {
      title: headlineMatch ? headlineMatch[1].trim() : 'Untitled Article',
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      content: contentMatch ? contentMatch[1].trim() : text
    };
  }

  getLanguageForCountry(countryCode) {
    const countryLanguageMap = {
      // English-speaking
      'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en', 'NZ': 'en', 'IE': 'en',
      'IN': 'en', 'PK': 'en', 'BD': 'en', 'PH': 'en', 'SG': 'en', 'ZA': 'en',
      
      // Romance languages
      'IT': 'it', 'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es',
      'PE': 'es', 'VE': 'es', 'FR': 'fr', 'BE': 'fr', 'CH': 'fr', 'PT': 'pt', 
      'BR': 'pt', 'RO': 'ro',
      
      // Germanic languages
      'DE': 'de', 'AT': 'de', 'NL': 'nl', 'SE': 'sv', 'NO': 'no', 'DK': 'da',
      
      // Asian languages
      'JP': 'ja', 'CN': 'zh', 'TW': 'zh', 'KR': 'ko', 'TH': 'th', 'VN': 'vi',
      'ID': 'id', 'MY': 'ms',
      
      // Middle Eastern
      'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'IL': 'he', 'TR': 'tr', 'IR': 'fa',
      
      // Eastern Europe
      'RU': 'ru', 'UA': 'uk', 'PL': 'pl', 'CZ': 'cs', 'HU': 'hu', 'GR': 'el',
      
      // Others
      'FI': 'fi', 'HR': 'hr', 'BG': 'bg', 'RS': 'sr', 'SK': 'sk', 'SI': 'sl'
    };

    return countryLanguageMap[countryCode] || 'en';
  }

  getLanguageName(code) {
    const languageNames = {
      'en': 'English', 'it': 'Italian', 'es': 'Spanish', 'fr': 'French',
      'de': 'German', 'pt': 'Portuguese', 'ja': 'Japanese', 'zh': 'Chinese',
      'ar': 'Arabic', 'ru': 'Russian', 'ko': 'Korean', 'nl': 'Dutch',
      'sv': 'Swedish', 'no': 'Norwegian', 'da': 'Danish', 'fi': 'Finnish',
      'pl': 'Polish', 'tr': 'Turkish', 'he': 'Hebrew', 'th': 'Thai',
      'vi': 'Vietnamese', 'id': 'Indonesian', 'ms': 'Malay', 'uk': 'Ukrainian',
      'cs': 'Czech', 'hu': 'Hungarian', 'ro': 'Romanian', 'el': 'Greek',
      'hr': 'Croatian', 'bg': 'Bulgarian', 'sr': 'Serbian', 'sk': 'Slovak',
      'sl': 'Slovenian', 'fa': 'Persian'
    };
    return languageNames[code] || 'English';
  }

  getRegionForLanguage(language) {
    const regionMap = {
      'en': 'us-en', 'it': 'it-it', 'es': 'es-es', 'fr': 'fr-fr',
      'de': 'de-de', 'pt': 'br-pt', 'ja': 'jp-jp', 'zh': 'cn-zh',
      'ar': 'xa-ar', 'ru': 'ru-ru', 'ko': 'kr-kr', 'nl': 'nl-nl',
      'sv': 'se-sv', 'no': 'no-no', 'da': 'dk-da', 'fi': 'fi-fi',
      'pl': 'pl-pl', 'tr': 'tr-tr', 'he': 'il-he', 'th': 'th-th',
      'vi': 'vn-vi', 'id': 'id-id', 'uk': 'ua-uk', 'cs': 'cz-cs'
    };
    return regionMap[language] || 'wt-wt'; // wt-wt = worldwide
  }
}

module.exports = new OllamaService();
