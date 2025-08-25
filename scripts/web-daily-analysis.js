// Configurar dotenv con múltiples fallbacks
try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  console.log('No .env.local found, trying .env...');
  try {
    require('dotenv').config();
  } catch (error2) {
    console.log('No .env files found, using environment variables');
  }
}

const Database = require('../lib/database');
const GitHubScraper = require('../lib/scraper');
const AIAnalyzer = require('../lib/analyzer');

class WebDailyAnalysis {
  constructor() {
    this.db = new Database();
    this.scraper = new GitHubScraper();
    this.analyzer = new AIAnalyzer();
    this.today = new Date().toISOString().split('T')[0];
  }

  async run(forceAnalysis = false) {
    const startTime = Date.now();
    console.log(`🌐 Iniciando análisis web diario - ${this.today}\n`);

    try {
      // 1. Inicializar base de datos
      await this.initializeDatabase();

      let analysisResults;
      let savedRepos = 0;

      // Check if analysis already exists for today
      const existingRepos = await this.db.getProcessedReposForDate(this.today);
      const hasAnalysisToday = existingRepos.length > 0;

      if (hasAnalysisToday && !forceAnalysis) {
        console.log('📊 Usando análisis existente del día para la web...');
        
        // Get existing analysis results
        analysisResults = await this.getExistingAnalysis();
        
        if (analysisResults.length === 0) {
          console.log('⚠️ No se encontraron resultados existentes, ejecutando análisis completo...');
          analysisResults = await this.runFullAnalysis();
          savedRepos = analysisResults.length;
        }
      } else {
        console.log('🔄 Ejecutando análisis completo para web...');
        analysisResults = await this.runFullAnalysis();
        savedRepos = analysisResults.length;
      }

      // NO ENVIAR EMAILS - Solo actualización web
      console.log('📄 Análisis web completado - La web mostrará el contenido actualizado');

      // 6. Estadísticas finales
      return this.buildResult(savedRepos, analysisResults.length * 3, 0, startTime);

    } catch (error) {
      console.error('❌ Error en análisis web diario:', error.message);
      throw error;
    } finally {
      await this.db.close();
    }
  }

  async runFullAnalysis() {
    // 2. Scraping de GitHub trending
    const scrapedRepos = await this.scrapeGitHub();

    // 3. Filtrar repos ya procesados
    const newRepos = await this.filterNewRepos(scrapedRepos);

    if (newRepos.length === 0) {
      console.log('✅ No hay nuevos repositorios para procesar hoy');
      return [];
    }

    // 4. Análisis con IA
    const analysisResults = await this.analyzeRepos(newRepos);

    // 5. Guardar en base de datos
    await this.saveResults(analysisResults);

    return analysisResults;
  }

  async getExistingAnalysis() {
    const repos = await this.db.getLatestIdeas();
    
    // Convert Firebase repo data to expected format
    return repos.map(repo => {
      return {
        repo_name: repo.repo_name,
        repo_url: repo.repo_url,
        repo_description: repo.repo_description,
        stars: repo.stars,
        language: repo.language,
        ideas: repo.ideas,
        processed_date: repo.processed_date,
        created_at: repo.created_at
      };
    });
  }

  async initializeDatabase() {
    console.log('🗄️  Inicializando base de datos...');
    await this.db.init();
    console.log('✅ Base de datos lista\n');
  }

  async scrapeGitHub() {
    console.log('🕷️  Scrapeando GitHub trending...');
    const repos = await this.scraper.getTrendingRepos(3);
    console.log(`✅ Encontrados ${repos.length} repositorios trending\n`);
    return repos;
  }

  async filterNewRepos(repos) {
    console.log('🔍 Filtrando repositorios nuevos...');
    const newRepos = [];

    for (const repo of repos) {
      const isProcessed = await this.db.isRepoProcessedToday(repo.name, this.today);
      if (!isProcessed) {
        newRepos.push(repo);
      }
    }

    console.log(`✅ ${newRepos.length} repositorios nuevos para procesar\n`);
    return newRepos;
  }

  async analyzeRepos(repos) {
    console.log('🤖 Iniciando análisis con IA...');
    const results = await this.analyzer.batchAnalyzeRepositories(repos);
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Análisis completado: ${successCount}/${repos.length} exitosos\n`);
    
    return results;
  }

  async saveResults(analysisResults) {
    console.log('💾 Guardando resultados en base de datos...');
    let savedCount = 0;

    for (const result of analysisResults) {
      try {
        // LEAN: Save repo with ideas in single operation
        const allIdeas = {
          es: result.ideas?.es || [],
          en: result.ideas?.en || []
        };
        
        await this.db.saveRepoWithIdeas(result.repo, allIdeas, this.today);
        savedCount++;
      } catch (error) {
        console.error(`❌ Error guardando ${result.repo.name}:`, error.message);
      }
    }

    console.log(`✅ Guardados ${savedCount} repositorios con sus ideas\n`);
    return savedCount;
  }

  buildResult(processedRepos, generatedIdeas, emailsSent, startTime) {
    const executionTime = Math.round((Date.now() - startTime) / 1000);
    
    const result = {
      success: true,
      date: this.today,
      processed_repos: processedRepos,
      generated_ideas: generatedIdeas,
      emails_sent: emailsSent, // Always 0 for web-only analysis
      execution_time: `${executionTime}s`
    };

    console.log('📊 RESUMEN DEL ANÁLISIS WEB DIARIO:');
    console.log(`   Fecha: ${result.date}`);
    console.log(`   Repositorios procesados: ${result.processed_repos}`);
    console.log(`   Ideas generadas: ${result.generated_ideas}`);
    console.log(`   Emails enviados: ${result.emails_sent} (Solo actualización web)`);
    console.log(`   Tiempo de ejecución: ${result.execution_time}`);
    console.log('✅ Análisis web diario completado exitosamente');

    return result;
  }
}

async function main() {
  const analysis = new WebDailyAnalysis();
  
  try {
    // Check for force analysis flag
    const forceAnalysis = process.env.FORCE_ANALYSIS === 'true' || process.argv.includes('--force');
    
    await analysis.run(forceAnalysis);
    
  } catch (error) {
    console.error('💥 Análisis web diario falló:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = WebDailyAnalysis;