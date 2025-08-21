const admin = require('firebase-admin');

// Validar configuración Firebase al inicio
function validateFirebaseConfig() {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID', 
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID',
    'FIREBASE_CLIENT_X509_CERT_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`⚠️ Configuración Firebase incompleta. Faltan: ${missing.join(', ')}`);
  }
  
  // Validar formato básico
  if (!process.env.FIREBASE_CLIENT_EMAIL.includes('@')) {
    throw new Error('⚠️ FIREBASE_CLIENT_EMAIL parece tener formato inválido');
  }
  
  if (!process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
    throw new Error('⚠️ FIREBASE_PRIVATE_KEY parece tener formato inválido');
  }
  
  console.log('✅ Configuración Firebase validada correctamente');
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Validar antes de inicializar
  validateFirebaseConfig();
  
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseId: 'reporadar'
  });
}

// Initialize Firestore with specific database ID
const db = admin.firestore(admin.app(), 'reporadar');

// Export para CommonJS
module.exports = { db, admin };