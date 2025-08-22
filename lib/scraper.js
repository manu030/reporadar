const axios = require('axios');
const cheerio = require('cheerio');

class GitHubScraper {
  constructor() {
    this.baseUrl = 'https://github.com';
    this.trendingUrl = 'https://github.com/trending?since=daily';
    this.rawUrl = 'https://raw.githubusercontent.com';
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

      // Seleccionar elementos de repositorios
      const repoPromises = [];
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

        // Push async operation to promises array
        repoPromises.push(
          this.getRepoDescription(owner, name, description).then(enhancedDescription => ({
            name: fullName,
            owner,
            repository: name,
            url,
            description: enhancedDescription || description || `${name} - GitHub trending repository`,
            stars,
            language
          }))
        );
      });

      // Wait for all README fetches to complete
      const repos = await Promise.all(repoPromises);
      
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

  async getRepoDescription(owner, repo, fallbackDescription) {
    try {
      // Try to get README from main branch first, then master
      const branches = ['main', 'master'];
      const readmeFiles = ['README.md', 'readme.md', 'README.txt', 'README'];
      
      for (const branch of branches) {
        for (const readmeFile of readmeFiles) {
          try {
            const readmeUrl = `${this.rawUrl}/${owner}/${repo}/${branch}/${readmeFile}`;
            const response = await axios.get(readmeUrl, {
              timeout: 5000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
              }
            });

            if (response.data && response.status === 200) {
              const content = response.data.toString();
              const description = this.extractDescriptionFromReadme(content, repo);
              
              if (description && description.length > 50) {
                console.log(`📖 Enhanced description from README for ${owner}/${repo}`);
                return description;
              }
            }
          } catch (readmeError) {
            // Continue to next README file/branch
            continue;
          }
        }
      }
      
      // Fallback to original description
      return fallbackDescription;
      
    } catch (error) {
      console.warn(`⚠️ Could not fetch README for ${owner}/${repo}:`, error.message);
      return fallbackDescription;
    }
  }

  extractDescriptionFromReadme(content, repoName) {
    try {
      // Clean content - remove markdown syntax
      let cleanContent = content
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]*`/g, '') // Remove inline code
        .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
        .replace(/#+\s*/g, '') // Remove headers
        .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // Remove bold/italic
        .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
        .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
        .replace(/^\s*>\s*/gm, '') // Remove blockquotes
        .replace(/^\s*[-=]+\s*$/gm, '') // Remove horizontal rules
        .trim();

      // Find first meaningful paragraph (usually after title)
      const lines = cleanContent.split('\n').filter(line => line.trim().length > 0);
      
      // Skip first line if it looks like a title (contains repo name or is very short)
      let startIndex = 0;
      if (lines.length > 0 && 
          (lines[0].toLowerCase().includes(repoName.toLowerCase()) || 
           lines[0].length < 30)) {
        startIndex = 1;
      }
      
      // Find first substantial description paragraph
      for (let i = startIndex; i < Math.min(lines.length, 5); i++) {
        const line = lines[i].trim();
        
        // Skip badges, shields, or single words
        if (line.includes('badge') || line.includes('shield') || 
            line.includes('http') || line.split(' ').length < 5) {
          continue;
        }
        
        // Take first 2-3 sentences
        const sentences = line.split(/[.!?]+/).filter(s => s.trim().length > 10);
        let description = sentences.slice(0, 2).join('. ').trim();
        
        if (description.length > 50 && description.length < 300) {
          return description.endsWith('.') ? description : description + '.';
        }
      }
      
      // Last resort: take first substantial line
      const firstLine = lines.find(line => 
        line.length > 50 && 
        line.length < 300 && 
        !line.includes('http') &&
        !line.toLowerCase().includes(repoName.toLowerCase())
      );
      
      if (firstLine) {
        return firstLine.endsWith('.') ? firstLine : firstLine + '.';
      }
      
      return null;
    } catch (error) {
      console.warn('Error extracting description from README:', error.message);
      return null;
    }
  }
}

module.exports = GitHubScraper;