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

class USANewsletter {
  constructor() {
    this.db = new Database();
    this.mailer = new Mailer();
    this.today = new Date().toISOString().split('T')[0];
  }

  async run() {
    const startTime = Date.now();
    console.log(`📧 Sending USA newsletter - ${this.today}\n`);

    try {
      // 1. Initialize database
      await this.initializeDatabase();

      // 2. Get latest analysis (should already exist from daily web analysis)
      const analysisResults = await this.getLatestAnalysis();

      if (analysisResults.length === 0) {
        console.log('⚠️ No analysis available to send newsletter');
        return this.buildResult(0, 0, 0, startTime);
      }

      // 3. Send newsletter only to USA (EN locale)
      const emailStats = await this.sendUSANewsletter(analysisResults);

      // 4. Final statistics
      const emailsSent = emailStats.sent || 0;
      return this.buildResult(0, 0, emailsSent, startTime);

    } catch (error) {
      console.error('❌ Error in USA newsletter:', error.message);
      throw error;
    } finally {
      await this.db.close();
    }
  }

  async getLatestAnalysis() {
    console.log('📊 Getting latest analysis...');
    const repos = await this.db.getLatestIdeas('en'); // Only English ideas
    
    // Convert Firebase repo data to mailer-expected format
    return repos.map(repo => {
      return {
        repo_name: repo.repo_name,
        repo_url: repo.repo_url,
        repo_description: repo.repo_description,
        stars: repo.stars,
        language: repo.language,
        ideas: repo.ideas, // English ideas
        processed_date: repo.processed_date,
        created_at: repo.created_at
      };
    });
  }

  async initializeDatabase() {
    console.log('🗄️  Initializing database...');
    await this.db.init();
    console.log('✅ Database ready\n');
  }

  async sendUSANewsletter(analysisResults) {
    console.log('📧 Sending newsletter to USA users...');
    const emailStats = await this.mailer.sendDailyNewsletterToLocale(analysisResults, this.db, 'en');
    
    if (emailStats.sent === 0) {
      console.log('📧 No USA subscribers found');
      return { sent: 0, failed: 0 };
    }
    
    console.log(`✅ Newsletter sent: ${emailStats.sent} USA users\n`);
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

    console.log('📊 USA NEWSLETTER SUMMARY:');
    console.log(`   Date: ${result.date}`);
    console.log(`   Emails sent (EN): ${result.emails_sent}`);
    console.log(`   Execution time: ${result.execution_time}`);
    console.log('✅ USA newsletter sent successfully');

    return result;
  }
}

async function main() {
  const newsletter = new USANewsletter();
  
  try {
    await newsletter.run();
  } catch (error) {
    console.error('💥 USA newsletter failed:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = USANewsletter;