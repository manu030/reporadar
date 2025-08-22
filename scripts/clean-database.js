require('dotenv').config({ path: '.env.local' });
const Database = require('../lib/database');

async function cleanDatabase() {
  console.log('🧹 Limpiando base de datos...');
  
  const db = new Database();
  
  try {
    await db.connect();
    
    // Limpiar colección de repositorios procesados
    console.log('📦 Limpiando repositorios procesados...');
    const reposSnapshot = await db.db.collection('processed_repos').get();
    const repoBatch = db.db.batch();
    
    reposSnapshot.docs.forEach((doc) => {
      repoBatch.delete(doc.ref);
    });
    
    if (!reposSnapshot.empty) {
      await repoBatch.commit();
      console.log(`✅ Eliminados ${reposSnapshot.size} repositorios`);
    } else {
      console.log('✅ No hay repositorios que eliminar');
    }
    
    // Mantener usuarios pero opcional limpiarlos también
    console.log('👥 Usuarios existentes:');
    const usersSnapshot = await db.db.collection('users').get();
    console.log(`   - Total usuarios: ${usersSnapshot.size}`);
    
    // Opcional: descomentar para limpiar usuarios también
    // console.log('👥 Limpiando usuarios...');
    // const usersBatch = db.db.batch();
    // usersSnapshot.docs.forEach((doc) => {
    //   usersBatch.delete(doc.ref);
    // });
    // if (!usersSnapshot.empty) {
    //   await usersBatch.commit();
    //   console.log(`✅ Eliminados ${usersSnapshot.size} usuarios`);
    // }
    
    console.log('\n✅ Base de datos limpiada correctamente');
    console.log('📊 Estado actual:');
    console.log(`   - Repositorios procesados: 0`);
    console.log(`   - Ideas generadas: 0`);
    console.log(`   - Usuarios: ${usersSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    throw error;
  } finally {
    await db.close();
  }
}

// Execute if called directly
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      console.log('\n🎉 Limpieza completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en limpieza:', error.message);
      process.exit(1);
    });
}

module.exports = cleanDatabase;