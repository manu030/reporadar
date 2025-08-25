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
const Mailer = require('../lib/mailer');

class SpainNewsletter {
  constructor() {
    this.db = new Database();
    this.mailer = new Mailer();
    this.today = new Date().toISOString().split('T')[0];
  }

  async run() {
    const startTime = Date.now();
    console.log(`📧 Enviando newsletter España - ${this.today}\n`);

    try {
      // 1. Inicializar base de datos
      await this.initializeDatabase();

      // 2. Obtener análisis más reciente (ya debe existir del análisis web diario)
      const analysisResults = await this.getLatestAnalysis();

      if (analysisResults.length === 0) {
        console.log('⚠️ No hay análisis disponible para enviar newsletter');
        return this.buildResult(0, 0, 0, startTime);
      }

      // 3. Enviar newsletter solo a España (ES locale)
      const emailStats = await this.sendSpanishNewsletter(analysisResults);

      // 4. Estadísticas finales
      const emailsSent = emailStats.sent || 0;
      return this.buildResult(0, 0, emailsSent, startTime);

    } catch (error) {
      console.error('❌ Error en newsletter España:', error.message);
      throw error;
    } finally {
      await this.db.close();
    }
  }

  async getLatestAnalysis() {
    console.log('📊 Obteniendo análisis más reciente...');
    const repos = await this.db.getLatestIdeas('es'); // Solo ideas en español
    
    // Convert Firebase repo data to mailer-expected format
    return repos.map(repo => {
      return {
        repo_name: repo.repo_name,
        repo_url: repo.repo_url,
        repo_description: repo.repo_description,
        stars: repo.stars,
        language: repo.language,
        ideas: repo.ideas, // Spanish ideas
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

  async sendSpanishNewsletter(analysisResults) {
    console.log('📧 Enviando newsletter a usuarios de España...');
    const emailStats = await this.mailer.sendDailyNewsletterToLocale(analysisResults, this.db, 'es');
    
    if (emailStats.sent === 0) {
      console.log('📧 No hay usuarios suscritos en España');
      return { sent: 0, failed: 0 };
    }
    
    console.log(`✅ Newsletter enviado: ${emailStats.sent} usuarios de España\n`);
    return emailStats;
  }

  buildResult(processedRepos, generatedIdeas, emailsSent, startTime) {
    const executionTime = Math.round((Date.now() - startTime) / 1000);
    
    const result = {
      success: true,
      date: this.today,
      processed_repos: processedRepos, // 0 - no processing, only sending
      generated_ideas: generatedIdeas, // 0 - no generation, only sending
      emails_sent: emailsSent,
      execution_time: `${executionTime}s`
    };

    console.log('📊 RESUMEN NEWSLETTER ESPAÑA:');
    console.log(`   Fecha: ${result.date}`);
    console.log(`   Emails enviados (ES): ${result.emails_sent}`);
    console.log(`   Tiempo de ejecución: ${result.execution_time}`);
    console.log('✅ Newsletter España enviado exitosamente');

    return result;
  }
}

async function main() {
  const newsletter = new SpainNewsletter();
  
  try {
    await newsletter.run();
  } catch (error) {
    console.error('💥 Newsletter España falló:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = SpainNewsletter;