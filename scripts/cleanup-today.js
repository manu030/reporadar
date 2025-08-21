require('dotenv').config({ path: '.env.local' });
const Database = require('../lib/database');

async function cleanup() {
  const db = new Database();
  await db.connect();
  
  const today = new Date().toISOString().split('T')[0];
  console.log('🧹 Limpiando datos de', today);
  
  try {
    // Limpiar ideas del día
    const ideasSnapshot = await db.db.collection('ideas').where('generated_date', '==', today).get();
    console.log('Ideas a eliminar:', ideasSnapshot.size);
    
    if (!ideasSnapshot.empty) {
      const batch1 = db.db.batch();
      ideasSnapshot.docs.forEach(doc => {
        batch1.delete(doc.ref);
      });
      await batch1.commit();
    }
    
    // Limpiar repos procesados del día
    const reposSnapshot = await db.db.collection('processed_repos').where('processed_date', '==', today).get();
    console.log('Repos a eliminar:', reposSnapshot.size);
    
    if (!reposSnapshot.empty) {
      const batch2 = db.db.batch();
      reposSnapshot.docs.forEach(doc => {
        batch2.delete(doc.ref);
      });
      await batch2.commit();
    }
    
    console.log('✅ Limpieza completada');
  } catch (error) {
    console.error('Error en limpieza:', error);
  } finally {
    await db.close();
  }
}

cleanup().catch(console.error);