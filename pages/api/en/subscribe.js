const Database = require('../../../lib/database');
const Mailer = require('../../../lib/mailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { email } = req.body;

  // Basic validation
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Email is required' 
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid email' 
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const db = new Database();
  const mailer = new Mailer();

  try {
    await db.connect();

    // Check if already exists
    const existingUser = await db.getUser(normalizedEmail);
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'This email is already subscribed' 
      });
    }

    // Create user with English locale
    await db.addUser(normalizedEmail, 'en');
    
    // Send welcome email in English
    try {
      await mailer.sendWelcomeEmail(normalizedEmail, 'en');
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError.message);
      // Don't fail subscription if email fails
    }

    console.log(`✅ New English subscription: ${normalizedEmail}`);

    res.status(201).json({ 
      success: true, 
      message: 'Subscription successful' 
    });

  } catch (error) {
    console.error('Error in subscription:', error.message);

    if (error.message === 'Email already exists') {
      return res.status(409).json({ 
        success: false, 
        error: 'This email is already subscribed' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });

  } finally {
    await db.close();
  }
}