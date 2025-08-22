const Database = require('../../lib/database');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  try {
    const db = new Database();
    await db.connect();
    
    const ideas = await db.getIdeasForDate(date);
    
    await db.close();

    // Serialize Firebase Timestamps
    const serialize = (obj) => {
      try {
        if (obj === null || obj === undefined) return null;
        if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') return obj;
        if (obj && obj.toDate && typeof obj.toDate === 'function') return obj.toDate().toISOString();
        if (Array.isArray(obj)) return obj.map(serialize);
        if (typeof obj === 'object') {
          const serialized = {};
          for (const [key, value] of Object.entries(obj)) {
            try {
              serialized[key] = serialize(value);
            } catch (e) {
              serialized[key] = null;
            }
          }
          return serialized;
        }
        return obj;
      } catch (e) {
        return null;
      }
    };

    const serializedIdeas = serialize(ideas || []) || [];

    return res.status(200).json({ 
      success: true,
      ideas: serializedIdeas,
      date: date
    });

  } catch (error) {
    console.error('Error fetching ideas:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Error fetching ideas for date'
    });
  }
}