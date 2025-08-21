const DailyAnalysis = require('../../../scripts/daily-analysis');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  // Verificar autorización (GitHub Actions)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('❌ CRON_SECRET no está configurado');
    return res.status(500).json({ 
      success: false, 
      error: 'Configuración del servidor incompleta' 
    });
  }
  
  const expectedAuth = `Bearer ${cronSecret}`;
  
  if (!authHeader || authHeader !== expectedAuth) {
    console.warn('❌ Intento de acceso no autorizado al endpoint de cron');
    return res.status(401).json({ 
      success: false, 
      error: 'No autorizado' 
    });
  }

  console.log('🚀 Iniciando análisis diario desde API endpoint...');

  try {
    const analysis = new DailyAnalysis();
    const result = await analysis.run();

    console.log('✅ Análisis diario completado exitosamente');
    
    res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error en análisis diario:', error.message);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Error ejecutando análisis diario'
    });
  }
}

// Configurar timeout más largo para este endpoint
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
    externalResolver: true,
  },
  maxDuration: 300 // 5 minutos
};