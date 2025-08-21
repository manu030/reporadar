const AIAnalyzer = require('../lib/analyzer');
require('dotenv').config({ path: '.env.local' });

async function testAnalyzer() {
  console.log('🧪 Testing AI Analyzer...\n');
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY no está configurada en .env.local');
    console.log('💡 Crea el archivo .env.local con tu API key de OpenAI');
    return;
  }
  
  const analyzer = new AIAnalyzer();
  
  // Test conexión
  console.log('1. Testing conexión con OpenAI...');
  const connectionOk = await analyzer.testConnection();
  
  if (!connectionOk) {
    console.error('❌ Error conectando con OpenAI API');
    return;
  }
  
  console.log('✅ Conexión exitosa\n');
  
  // Test análisis de repo
  console.log('2. Testing análisis de repositorio...');
  
  const testRepo = {
    name: 'vercel/next.js',
    repository: 'next.js',
    url: 'https://github.com/vercel/next.js',
    description: 'The React Framework for the Web',
    stars: 125340,
    language: 'JavaScript'
  };
  
  try {
    const ideas = await analyzer.analyzeRepository(testRepo);
    
    console.log('📊 Ideas generadas:\n');
    ideas.forEach((idea, index) => {
      console.log(`${index + 1}. ${idea}`);
      console.log(`   Longitud: ${idea.length} caracteres\n`);
    });
    
    // Test validación
    console.log('3. Testing validación de ideas...');
    const validation = await analyzer.validateIdeas(ideas);
    
    console.log('✅ Validación:', validation.valid ? 'PASÓ' : 'FALLÓ');
    if (!validation.valid && validation.issues) {
      console.log('⚠️  Problemas encontrados:');
      validation.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('\n✅ Analyzer funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error en el analyzer:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testAnalyzer();
}

module.exports = testAnalyzer;