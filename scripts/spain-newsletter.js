const DailyAnalysis = require('./daily-analysis');
require('dotenv').config({ path: '.env.local' });

async function runSpainNewsletter() {
  console.log('🇪🇸 Iniciando newsletter para España (8:00 AM CET)...\n');
  
  const analysis = new DailyAnalysis();
  const forceAnalysis = process.env.FORCE_ANALYSIS === 'true';
  
  try {
    // Run analysis with Spanish locale only
    const result = await analysis.run('es', forceAnalysis);
    
    console.log('\n🎉 Newsletter de España completado exitosamente!');
    console.log(`📊 Emails enviados: ${result.emails_sent}`);
    console.log(`⏱️  Tiempo de ejecución: ${result.execution_time}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error en newsletter de España:', error.message);
    throw error;
  }
}

// Execute if called directly
if (require.main === module) {
  runSpainNewsletter()
    .then(() => {
      console.log('✅ Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Newsletter falló:', error.message);
      process.exit(1);
    });
}

module.exports = runSpainNewsletter;