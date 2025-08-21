const Database = require('../../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  const db = new Database();

  try {
    await db.connect();

    const latestIdeas = await db.getLatestIdeas();
    
    if (!latestIdeas || latestIdeas.length === 0) {
      return res.status(200).json({
        date: null,
        repos: []
      });
    }

    // Formatear respuesta
    const formattedRepos = latestIdeas.map(repo => ({
      id: repo.repo_id,
      name: repo.repo_name,
      url: repo.repo_url,
      description: repo.repo_description,
      stars: repo.stars,
      language: repo.language,
      ideas: repo.ideas
    }));

    res.status(200).json({
      date: latestIdeas[0].processed_date,
      repos: formattedRepos
    });

  } catch (error) {
    console.error('Error obteniendo ideas:', error.message);
    
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });

  } finally {
    await db.close();
  }
}