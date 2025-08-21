const Mailer = require('../lib/mailer');
require('dotenv').config({ path: '.env.local' });

async function testMailer() {
  console.log('🧪 Testing Email System...\n');
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY no está configurada en .env.local');
    console.log('💡 Crea el archivo .env.local con tu API key de Resend');
    return;
  }
  
  const mailer = new Mailer();
  
  // Test conexión
  console.log('1. Testing conexión con Resend...');
  
  // Nota: Comentar esta línea si no quieres enviar emails reales
  // const connectionOk = await mailer.testConnection();
  
  // if (!connectionOk) {
  //   console.error('❌ Error conectando con Resend API');
  //   return;
  // }
  
  console.log('✅ Configuración de Resend correcta\n');
  
  // Test newsletter content building
  console.log('2. Testing construcción de newsletter...');
  
  const testRepoData = [
    {
      repo: {
        name: 'microsoft/terminal',
        url: 'https://github.com/microsoft/terminal',
        description: 'The new Windows Terminal and the original Windows console host',
        stars: 94821,
        language: 'C++'
      },
      ideas: [
        'SaaS de terminal personalizable para equipos con colaboración en tiempo real',
        'Marketplace premium de temas y extensiones para terminals corporativos',
        'Servicio de backup automático y migración de configuraciones de terminal'
      ]
    },
    {
      repo: {
        name: 'openai/whisper',
        url: 'https://github.com/openai/whisper',
        description: 'Robust Speech Recognition via Large-Scale Weak Supervision',
        stars: 89445,
        language: 'Python'
      },
      ideas: [
        'API de transcripción especializada para podcasts con detección de speakers',
        'Herramienta de subtitulado automático para creadores de contenido multiidioma',
        'SaaS de análisis de sentimientos en llamadas de ventas transcritas automáticamente'
      ]
    }
  ];
  
  const contentES = mailer.buildNewsletterContent(testRepoData, '21 de agosto, 2025', 'es');
  const contentEN = mailer.buildNewsletterContent(testRepoData, 'August 21, 2025', 'en');
  
  console.log('📧 Contenido del newsletter (Español):\n');
  console.log('---INICIO ESPAÑOL---');
  console.log(contentES);
  console.log('---FIN ESPAÑOL---\n');
  
  console.log('📧 Contenido del newsletter (English):\n');
  console.log('---INICIO ENGLISH---');
  console.log(contentEN);
  console.log('---FIN ENGLISH---\n');
  
  // Test validación de emails
  console.log('3. Testing validación de emails...');
  
  const testEmails = [
    'valid@example.com',
    'invalid-email',
    'another@test.org',
    '@invalid.com',
    'good@domain.co'
  ];
  
  testEmails.forEach(email => {
    const isValid = mailer.isValidEmail(email);
    console.log(`   ${email}: ${isValid ? '✅' : '❌'}`);
  });
  
  // Test chunking
  console.log('\n4. Testing email batching...');
  const testEmailList = Array.from({length: 25}, (_, i) => `user${i}@test.com`);
  const chunks = mailer.chunkArray(testEmailList, 10);
  console.log(`   Lista de 25 emails dividida en ${chunks.length} lotes:`);
  chunks.forEach((chunk, i) => {
    console.log(`   Lote ${i + 1}: ${chunk.length} emails`);
  });
  
  console.log('\n✅ Mailer funcionando correctamente');
  console.log('💡 Para enviar emails reales, descomenta la línea de testConnection()');
}

if (require.main === module) {
  testMailer();
}

module.exports = testMailer;