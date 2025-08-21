export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar variables de entorno de Firebase
    const firebaseConfig = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY_ID: !!process.env.FIREBASE_PRIVATE_KEY_ID,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_CLIENT_ID: !!process.env.FIREBASE_CLIENT_ID,
      FIREBASE_CLIENT_X509_CERT_URL: !!process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };

    // Verificar otras variables
    const otherConfig = {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
      NODE_ENV: process.env.NODE_ENV,
    };

    // Intentar cargar Firebase
    let firebaseStatus = 'not_tested';
    try {
      const { db } = require('../../lib/firebase');
      firebaseStatus = 'loaded_successfully';
      
      // Intentar hacer una operación básica
      await db.collection('test').limit(1).get();
      firebaseStatus = 'connection_successful';
    } catch (firebaseError) {
      firebaseStatus = `error: ${firebaseError.message}`;
    }

    res.status(200).json({
      success: true,
      firebaseConfig,
      otherConfig,
      firebaseStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}