const axios = require('axios');
const cheerio = require('cheerio');

class GitHubScraper {
  constructor() {
    this.baseUrl = 'https://github.com';
    this.trendingUrl = 'https://github.com/trending?since=daily';
  }

  async getTrendingRepos(limit = 3) {
    console.log('🕷️  Scrapeando GitHub trending...');
    
    try {
      const response = await axios.get(this.trendingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const repos = [];

      // Seleccionar elementos de repositorios
      $('article.Box-row').each((index, element) => {
        if (index >= limit) return false; // Limitar a los primeros N repos

        const $repo = $(element);
        
        // Extraer información básica
        const nameElement = $repo.find('h2.h3 a');
        const fullName = nameElement.attr('href')?.replace('/', '') || '';
        const [owner, name] = fullName.split('/');
        
        if (!owner || !name) return; // Skip si no tiene formato correcto

        const url = `${this.baseUrl}${nameElement.attr('href')}`;
        const description = $repo.find('p.color-fg-muted').text().trim();
        
        // Extraer stars con múltiples selectores fallback
        let starsText = '';
        const starSelectors = [
          'a[href$="/stargazers"]',
          'span.d-inline-block.float-sm-right',
          '.f6.color-fg-muted a:first-child',
          '[aria-label*="star"]'
        ];
        
        for (const selector of starSelectors) {
          const element = $repo.find(selector);
          if (element.length > 0) {
            starsText = element.text().trim().replace(/,/g, '');
            break;
          }
        }
        
        let stars = 0;
        if (starsText) {
          // Limpiar texto y extraer números
          const cleanText = starsText.replace(/[^\d.k]/gi, '');
          if (cleanText.includes('k')) {
            stars = Math.round(parseFloat(cleanText) * 1000);
          } else {
            stars = parseInt(cleanText) || 0;
          }
        }

        // Extraer lenguaje con selectores fallback
        let language = 'Unknown';
        const languageSelectors = [
          'span[itemprop="programmingLanguage"]',
          '.f6.color-fg-muted span:last-child',
          '.ml-0.mr-3'
        ];
        
        for (const selector of languageSelectors) {
          const element = $repo.find(selector);
          if (element.length > 0) {
            const text = element.text().trim();
            if (text && !text.includes('star') && !text.includes('fork')) {
              language = text;
              break;
            }
          }
        }

        repos.push({
          name: fullName,
          owner,
          repository: name,
          url,
          description: description || `${name} - GitHub trending repository`,
          stars,
          language
        });
      });

      console.log(`✅ Encontrados ${repos.length} repositorios trending`);
      return repos;

    } catch (error) {
      console.error('❌ Error scrapeando GitHub:', error.message);
      
      // Fallback con datos de ejemplo para testing
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Usando datos de fallback para desarrollo...');
        return this.getFallbackRepos(limit);
      }
      
      throw error;
    }
  }

  // Datos de fallback para desarrollo/testing
  getFallbackRepos(limit = 5) {
    const fallbackRepos = [
      {
        name: 'microsoft/terminal',
        owner: 'microsoft',
        repository: 'terminal',
        url: 'https://github.com/microsoft/terminal',
        description: 'The new Windows Terminal and the original Windows console host',
        stars: 94821,
        language: 'C++'
      },
      {
        name: 'openai/whisper',
        owner: 'openai',
        repository: 'whisper',
        url: 'https://github.com/openai/whisper',
        description: 'Robust Speech Recognition via Large-Scale Weak Supervision',
        stars: 89445,
        language: 'Python'
      },
      {
        name: 'vercel/next.js',
        owner: 'vercel',
        repository: 'next.js',
        url: 'https://github.com/vercel/next.js',
        description: 'The React Framework for the Web',
        stars: 125340,
        language: 'JavaScript'
      },
      {
        name: 'huggingface/transformers',
        owner: 'huggingface',
        repository: 'transformers',
        url: 'https://github.com/huggingface/transformers',
        description: 'State-of-the-art Machine Learning for JAX, PyTorch and TensorFlow',
        stars: 132891,
        language: 'Python'
      },
      {
        name: 'tailwindlabs/tailwindcss',
        owner: 'tailwindlabs',
        repository: 'tailwindcss',
        url: 'https://github.com/tailwindlabs/tailwindcss',
        description: 'A utility-first CSS framework for rapid UI development',
        stars: 82453,
        language: 'CSS'
      }
    ];

    return fallbackRepos.slice(0, limit);
  }

  // Método auxiliar para validar estructura de repo
  validateRepo(repo) {
    const required = ['name', 'url', 'description', 'stars', 'language'];
    return required.every(field => repo[field] !== undefined);
  }

  // Método para obtener detalles adicionales de un repo específico
  async getRepoDetails(owner, repo) {
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'RepoRadar-Bot/1.0'
        },
        timeout: 5000
      });

      const data = response.data;
      return {
        fullName: data.full_name,
        description: data.description || '',
        stars: data.stargazers_count,
        language: data.language || 'Unknown',
        topics: data.topics || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.warn(`⚠️  No se pudieron obtener detalles de ${owner}/${repo}:`, error.message);
      return null;
    }
  }
}

module.exports = GitHubScraper;