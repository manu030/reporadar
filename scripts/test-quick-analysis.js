require('dotenv').config({ path: '.env.local' });
const Database = require('../lib/database');

async function quickTest() {
  console.log('🧪 Test rápido: Guardando ideas mock...');
  
  const db = new Database();
  
  try {
    await db.connect();
    
    const today = new Date().toISOString().split('T')[0];
    
    // Mock repo with ideas
    const mockRepo = {
      name: 'test/repo',
      url: 'https://github.com/test/repo',
      description: 'A test repository for demo purposes',
      stars: 1234,
      language: 'JavaScript'
    };
    
    const mockIdeas = {
      es: [
        {
          oneliner: "SaaS para automatizar testing de APIs REST con IA",
          problem: "Los equipos de desarrollo pierden horas configurando tests de APIs manualmente. Las empresas pagan hasta $100k/año en QA engineers para tareas repetitivas.",
          solution: "Plataforma que genera automáticamente tests completos analizando documentación OpenAPI. Incluye tests de performance, seguridad y edge cases usando machine learning.",
          business_model: "Freemium: 100 requests gratis/mes, luego $49/mes por desarrollador. Enterprise $299/mes con CI/CD integrations y reportes ejecutivos.",
          difficulty: "Medio"
        },
        {
          oneliner: "Marketplace de plantillas de testing personalizables",
          problem: "Cada proyecto necesita configurar tests desde cero. No existe un lugar centralizado para compartir y monetizar configuraciones de testing.",
          solution: "Marketplace donde developers venden plantillas de testing configuradas para frameworks específicos. Incluye templates para React, Vue, APIs, mobile, etc.",
          business_model: "Comisión del 30% por venta. Templates desde $5-$50. Revenue compartido con creadores. Objetivo: $25K/mes con 500+ templates.",
          difficulty: "Fácil"
        },
        {
          oneliner: "Herramienta enterprise para testing distribuido masivo",
          problem: "Las empresas grandes necesitan ejecutar miles de tests en paralelo. Los servicios actuales son caros y no escalan bien para equipos de +100 developers.",
          solution: "Infraestructura cloud que ejecuta tests distribuidos usando containers. Auto-escala según demanda, optimiza costos y genera reportes detallados por equipo/proyecto.",
          business_model: "Pay-per-use: $0.001 por test ejecutado. Planes enterprise desde $1000/mes. Target: empresas Fortune 500 con ahorros del 60% vs competencia.",
          difficulty: "Difícil"
        }
      ],
      en: [
        {
          oneliner: "SaaS to automate REST API testing with AI",
          problem: "Development teams waste hours manually configuring API tests. Companies pay up to $100k/year for QA engineers to do repetitive tasks.",
          solution: "Platform that automatically generates complete tests by analyzing OpenAPI documentation. Includes performance, security and edge case testing using machine learning.",
          business_model: "Freemium: 100 free requests/month, then $49/month per developer. Enterprise $299/month with CI/CD integrations and executive reports.",
          difficulty: "Medium"
        },
        {
          oneliner: "Marketplace for customizable testing templates",
          problem: "Every project needs to configure tests from scratch. There's no centralized place to share and monetize testing configurations.",
          solution: "Marketplace where developers sell testing templates configured for specific frameworks. Includes templates for React, Vue, APIs, mobile, etc.",
          business_model: "30% commission per sale. Templates from $5-$50. Revenue shared with creators. Goal: $25K/month with 500+ templates.",
          difficulty: "Easy"
        },
        {
          oneliner: "Enterprise tool for massive distributed testing",
          problem: "Large enterprises need to run thousands of tests in parallel. Current services are expensive and don't scale well for teams of 100+ developers.",
          solution: "Cloud infrastructure that runs distributed tests using containers. Auto-scales based on demand, optimizes costs and generates detailed reports per team/project.",
          business_model: "Pay-per-use: $0.001 per test executed. Enterprise plans from $1000/month. Target: Fortune 500 companies with 60% savings vs competition.",
          difficulty: "Hard"
        }
      ]
    };
    
    await db.saveRepoWithIdeas(mockRepo, mockIdeas, today);
    
    console.log('✅ Ideas mock guardadas correctamente');
    
    // Test API
    const latestIdeas = await db.getLatestIdeas('es');
    console.log(`📊 Ideas recuperadas (ES): ${latestIdeas.length} repositorios`);
    console.log(`💡 Ideas por repo: ${latestIdeas[0]?.ideas?.length || 0}`);
    
    console.log('\n🎉 Test completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  quickTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Test falló:', error.message);
      process.exit(1);
    });
}