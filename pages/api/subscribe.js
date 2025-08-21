const Database = require('../../lib/database');
const Mailer = require('../../lib/mailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  const { email } = req.body;

  // Validación básica
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Email es requerido' 
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email inválido' 
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const db = new Database();
  const mailer = new Mailer();

  try {
    await db.connect();

    // Verificar si ya existe
    const existingUser = await db.getUser(normalizedEmail);
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Este email ya está suscrito' 
      });
    }

    // Crear usuario con locale español
    await db.addUser(normalizedEmail, 'es');
    
    // Enviar email de bienvenida
    try {
      await mailer.sendWelcomeEmail(normalizedEmail);
    } catch (emailError) {
      console.error('Error enviando email de bienvenida:', emailError.message);
      // No fallar la suscripción si falla el email
    }

    console.log(`✅ Nueva suscripción: ${normalizedEmail}`);

    res.status(201).json({ 
      success: true, 
      message: 'Suscripción exitosa' 
    });

  } catch (error) {
    console.error('Error en suscripción:', {
      message: error.message,
      stack: error.stack,
      email: normalizedEmail
    });

    if (error.message === 'Email already exists') {
      return res.status(409).json({ 
        success: false, 
        error: 'Este email ya está suscrito' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });

  } finally {
    await db.close();
  }
}