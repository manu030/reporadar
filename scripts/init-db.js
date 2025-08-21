const Database = require('../lib/database');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('🗄️  Inicializando base de datos...');
  
  // Crear directorio data si no existe
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 Directorio data/ creado');
  }

  const db = new Database();
  
  try {
    await db.init();
    console.log('✅ Base de datos inicializada correctamente');
    
    // Mostrar estadísticas
    const userCount = await db.getUserCount();
    const repoCount = await db.getProcessedRepoCount();
    
    console.log(`👥 Usuarios registrados: ${userCount}`);
    console.log(`📦 Repositorios procesados: ${repoCount}`);
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;