const { db } = require('../../lib/firebase');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { feedback, timestamp, fingerprint, timeOnPage, honeypot } = req.body;

  try {
    // Bot detection - honeypot check
    if (honeypot && honeypot.trim() !== '') {
      console.warn('Bot detected via honeypot:', { fingerprint, honeypot });
      return res.status(400).json({ error: 'Invalid submission' });
    }

    // Basic validation
    if (!feedback || typeof feedback !== 'string') {
      return res.status(400).json({ error: 'Feedback is required' });
    }

    if (feedback.trim().length < 10) {
      return res.status(400).json({ error: 'Feedback too short' });
    }

    if (feedback.trim().length > 500) {
      return res.status(400).json({ error: 'Feedback too long' });
    }

    // Time-based bot detection
    if (!timeOnPage || timeOnPage < 5000) {
      console.warn('Bot detected via time:', { fingerprint, timeOnPage });
      return res.status(400).json({ error: 'Submission too fast' });
    }

    // Rate limiting - simple approach without compound query
    if (fingerprint) {
      // Get all submissions from this fingerprint and filter by time in-memory
      const allSubmissions = await db.collection('feedback')
        .where('fingerprint', '==', fingerprint)
        .get();

      const recentSubmissions = allSubmissions.docs.filter(doc => {
        const docData = doc.data();
        const docTime = docData.created_at?.toDate?.() || new Date(docData.timestamp || 0);
        return docTime > new Date(Date.now() - 60000);
      });

      if (recentSubmissions.length > 0) {
        console.warn('Rate limit exceeded:', { fingerprint });
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
    }

    // Get user IP for additional tracking
    const userIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress || 
                   'unknown';

    // Clean IP (take first if comma-separated)
    const cleanIP = userIP.split(',')[0].trim();

    // Store feedback in Firebase
    const feedbackDoc = {
      feedback: feedback.trim(),
      fingerprint: fingerprint || null,
      ip_address: cleanIP,
      time_on_page: timeOnPage,
      user_agent: req.headers['user-agent'] || 'unknown',
      timestamp: timestamp || Date.now(),
      created_at: new Date(),
      status: 'pending' // For moderation
    };

    const docRef = await db.collection('feedback').add(feedbackDoc);

    console.log('✅ Feedback submitted:', {
      id: docRef.id,
      feedback_length: feedback.length,
      fingerprint: fingerprint || 'none',
      ip: cleanIP
    });

    res.status(200).json({ 
      success: true,
      message: 'Feedback submitted successfully',
      id: docRef.id
    });

  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Error al procesar tu feedback'
    });
  }
}