const DailyAnalysis = require('./daily-analysis');
require('dotenv').config({ path: '.env.local' });

async function runUSANewsletter() {
  console.log('🇺🇸 Starting USA newsletter (8:00 AM PST)...\n');
  
  const analysis = new DailyAnalysis();
  const forceAnalysis = process.env.FORCE_ANALYSIS === 'true';
  
  try {
    // Run analysis with English locale only
    const result = await analysis.run('en', forceAnalysis);
    
    console.log('\n🎉 USA newsletter completed successfully!');
    console.log(`📊 Emails sent: ${result.emails_sent}`);
    console.log(`⏱️  Execution time: ${result.execution_time}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error in USA newsletter:', error.message);
    throw error;
  }
}

// Execute if called directly
if (require.main === module) {
  runUSANewsletter()
    .then(() => {
      console.log('✅ Process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Newsletter failed:', error.message);
      process.exit(1);
    });
}

module.exports = runUSANewsletter;