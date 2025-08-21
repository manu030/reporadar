const DailyAnalysis = require('../../scripts/daily-analysis');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  try {
    const analysis = new DailyAnalysis();
    const stats = await analysis.getStats();

    res.status(200).json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error.message);
    
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
}