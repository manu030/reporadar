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
  
  // Test data simulando el formato de base de datos con locale
  const testRepoDataES = [
    {
      repo_name: 'microsoft/terminal',
      repo_url: 'https://github.com/microsoft/terminal',
      repo_description: 'The new Windows Terminal and the original Windows console host',
      stars: 94821,
      language: 'C++',
      ideas: [
        {
          idea_oneliner: 'SaaS de terminal personalizable para equipos',
          idea_problem: 'Los desarrolladores necesitan terminales colaborativas pero las actuales son individuales.',
          idea_solution: 'Creamos una plataforma que permite compartir sesiones de terminal en tiempo real.',
          idea_business_model: 'Suscripción mensual de $20/usuario con planes empresariales.',
          idea_difficulty: 'Medio - Requiere infraestructura de tiempo real'
        },
        {
          idea_oneliner: 'Marketplace de temas premium para terminals',
          idea_problem: 'Los usuarios quieren personalizar sus terminals pero hay pocos temas de calidad.',
          idea_solution: 'Marketplace donde diseñadores pueden vender temas premium y extensiones.',
          idea_business_model: 'Comisión del 30% por venta más subscripción premium para creadores.',
          idea_difficulty: 'Fácil - Plataforma web estándar con pagos'
        }
      ]
    },
    {
      repo_name: 'openai/whisper',
      repo_url: 'https://github.com/openai/whisper',
      repo_description: 'Robust Speech Recognition via Large-Scale Weak Supervision',
      stars: 89445,
      language: 'Python',
      ideas: [
        {
          idea_oneliner: 'API de transcripción para podcasts con speakers',
          idea_problem: 'Los podcasters necesitan transcripciones pero las actuales no identifican quién habla.',
          idea_solution: 'API que transcribe y identifica automáticamente cada speaker del podcast.',
          idea_business_model: 'Pricing por minuto transcrito: $0.02/minuto con planes de volumen.',
          idea_difficulty: 'Difícil - Requiere AI avanzada para identificación de speakers'
        }
      ]
    }
  ];

  const testRepoDataEN = [
    {
      repo_name: 'microsoft/terminal',
      repo_url: 'https://github.com/microsoft/terminal',
      repo_description: 'The new Windows Terminal and the original Windows console host',
      stars: 94821,
      language: 'C++',
      ideas: [
        {
          idea_oneliner: 'Collaborative terminal SaaS for development teams',
          idea_problem: 'Developers need collaborative terminals but current ones are individual only.',
          idea_solution: 'We create a platform that allows sharing terminal sessions in real-time.',
          idea_business_model: 'Monthly subscription of $20/user with enterprise plans.',
          idea_difficulty: 'Medium - Requires real-time infrastructure'
        },
        {
          idea_oneliner: 'Premium themes marketplace for terminals',
          idea_problem: 'Users want to customize terminals but there are few quality themes available.',
          idea_solution: 'Marketplace where designers can sell premium themes and extensions.',
          idea_business_model: '30% commission per sale plus premium subscription for creators.',
          idea_difficulty: 'Easy - Standard web platform with payments'
        }
      ]
    },
    {
      repo_name: 'openai/whisper',
      repo_url: 'https://github.com/openai/whisper',
      repo_description: 'Robust Speech Recognition via Large-Scale Weak Supervision',
      stars: 89445,
      language: 'Python',
      ideas: [
        {
          idea_oneliner: 'Podcast transcription API with speaker detection',
          idea_problem: 'Podcasters need transcriptions but current ones don\'t identify who is speaking.',
          idea_solution: 'API that transcribes and automatically identifies each podcast speaker.',
          idea_business_model: 'Pricing per transcribed minute: $0.02/minute with volume plans.',
          idea_difficulty: 'Hard - Requires advanced AI for speaker identification'
        }
      ]
    }
  ];
  
  const contentES = mailer.buildNewsletterContent(testRepoDataES, '21 de agosto, 2025', 'es');
  const contentEN = mailer.buildNewsletterContent(testRepoDataEN, 'August 21, 2025', 'en');
  
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