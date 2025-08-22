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
const Mailer = require('../lib/mailer');

class DailyAnalysis {
  constructor() {
    this.db = new Database();
    this.scraper = new GitHubScraper();
    this.analyzer = new AIAnalyzer();
    this.mailer = new Mailer();
    this.today = new Date().toISOString().split('T')[0];
  }

  async run(locale = null, forceAnalysis = false) {
    const startTime = Date.now();
    console.log(`🚀 Iniciando análisis diario - ${this.today}${locale ? ` (${locale.toUpperCase()})` : ''}\n`);

    try {
      // 1. Inicializar base de datos
      await this.initializeDatabase();

      let analysisResults;
      let savedRepos = 0;

      // Check if analysis already exists for today
      const existingRepos = await this.db.getProcessedReposForDate(this.today);
      const hasAnalysisToday = existingRepos.length > 0;

      if (hasAnalysisToday && !forceAnalysis) {
        console.log('📊 Usando análisis existente del día...');
        
        // Get existing analysis results
        analysisResults = await this.getExistingAnalysis();
        
        if (analysisResults.length === 0) {
          console.log('⚠️ No se encontraron resultados existentes, ejecutando análisis completo...');
          analysisResults = await this.runFullAnalysis();
          savedRepos = analysisResults.length;
        }
      } else {
        console.log('🔄 Ejecutando análisis completo...');
        analysisResults = await this.runFullAnalysis();
        savedRepos = analysisResults.length;
      }

      // 6. Enviar newsletters (solo para el locale especificado)
      const emailStats = await this.sendNewsletters(analysisResults, locale);

      // 7. Estadísticas finales
      const emailsSent = typeof emailStats.sent !== 'undefined' ? emailStats.sent : emailStats.total?.sent || 0;
      return this.buildResult(savedRepos, analysisResults.length * 3, emailsSent, startTime);

    } catch (error) {
      console.error('❌ Error en análisis diario:', error.message);
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
    return repos.map(repo => ({
      repo: {
        name: repo.repo_name,
        url: repo.repo_url,
        description: repo.repo_description,
        stars: repo.stars,
        language: repo.language
      },
      ideas: repo.ideas,
      success: true
    }));
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
        await this.db.saveRepoWithIdeas(result.repo, result.ideas, this.today);
        savedCount++;
      } catch (error) {
        console.error(`❌ Error guardando ${result.repo.name}:`, error.message);
      }
    }

    console.log(`✅ Guardados ${savedCount} repositorios con sus ideas\n`);
    return savedCount;
  }

  async sendNewsletters(analysisResults, locale = null) {
    if (locale) {
      console.log(`📧 Enviando newsletters para ${locale.toUpperCase()}...`);
      const emailStats = await this.mailer.sendDailyNewsletterToLocale(analysisResults, this.db, locale);
      
      if (emailStats.sent === 0) {
        console.log(`📧 No hay usuarios suscritos en ${locale}`);
        return { sent: 0, failed: 0 };
      }
      
      console.log(`✅ Newsletters enviados: ${emailStats.sent} (${locale.toUpperCase()})\n`);
      return emailStats;
    } else {
      console.log('📧 Enviando newsletters bilingües...');
      
      // Use the new multilingual newsletter method
      const emailStats = await this.mailer.sendDailyNewslettersToAll(analysisResults, this.db);
      
      if (emailStats.total.sent === 0) {
        console.log('📧 No hay usuarios suscritos');
        return { sent: 0, failed: 0 };
      }
      
      console.log(`✅ Newsletters enviados: ${emailStats.total.sent} total (${emailStats.es.sent} ES, ${emailStats.en.sent} EN)\n`);
      return emailStats.total;
    }
  }

  buildResult(processedRepos, generatedIdeas, emailsSent, startTime) {
    const executionTime = Math.round((Date.now() - startTime) / 1000);
    
    const result = {
      success: true,
      date: this.today,
      processed_repos: processedRepos,
      generated_ideas: generatedIdeas,
      emails_sent: emailsSent,
      execution_time: `${executionTime}s`
    };

    console.log('📊 RESUMEN DEL ANÁLISIS DIARIO:');
    console.log(`   Fecha: ${result.date}`);
    console.log(`   Repositorios procesados: ${result.processed_repos}`);
    console.log(`   Ideas generadas: ${result.generated_ideas}`);
    console.log(`   Emails enviados: ${result.emails_sent}`);
    console.log(`   Tiempo de ejecución: ${result.execution_time}`);
    console.log('✅ Análisis diario completado exitosamente');

    return result;
  }

  // Método para ejecutar análisis manual (testing)
  async runTest() {
    console.log('🧪 Ejecutando análisis en modo TEST\n');
    
    // En modo test, usar solo 2 repos
    this.scraper.getTrendingRepos = () => this.scraper.getFallbackRepos(2);
    
    return await this.run();
  }

  // Método para limpiar datos de testing
  async cleanup() {
    console.log('🧹 Limpiando datos de test...');
    
    await this.db.connect();
    
    // Eliminar datos del día actual si es testing
    await this.db.run('DELETE FROM ideas WHERE generated_date = ?', [this.today]);
    await this.db.run('DELETE FROM processed_repos WHERE processed_date = ?', [this.today]);
    
    console.log('✅ Datos de test limpiados');
    await this.db.close();
  }

  // Estadísticas del sistema
  async getStats() {
    await this.db.connect();
    
    const userCount = await this.db.getUserCount();
    const repoCount = await this.db.getProcessedRepoCount();
    const latestIdeas = await this.db.getLatestIdeas();
    
    await this.db.close();
    
    return {
      total_subscribers: userCount,
      total_repos_processed: repoCount,
      latest_analysis_date: latestIdeas.length > 0 ? latestIdeas[0].processed_date : null,
      latest_repos_count: latestIdeas.length
    };
  }
}

async function main() {
  const analysis = new DailyAnalysis();
  
  try {
    // Verificar si es ejecución de test
    const isTest = process.argv.includes('--test');
    
    if (isTest) {
      await analysis.runTest();
    } else {
      await analysis.run();
    }
    
  } catch (error) {
    console.error('💥 Análisis diario falló:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = DailyAnalysis;