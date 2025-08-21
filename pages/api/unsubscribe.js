const Database = require('../../lib/database');
const jwt = require('jsonwebtoken');
const Mailer = require('../../lib/mailer');

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método no permitido' 
    });
  }

  let email;

  // Obtener email desde query params (GET) o body (POST)
  if (req.method === 'GET') {
    email = req.query.email;
  } else {
    // Para POST, puede venir como token o email directo
    const { token, email: directEmail } = req.body;
    
    if (token) {
      try {
        // Verificar token JWT seguro
        const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
        const decoded = jwt.verify(token, secret);
        email = decoded.email;
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          error: 'Token inválido o expirado' 
        });
      }
    } else {
      email = directEmail;
    }
  }

  // Validación
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

  // Para GET, mostrar página de confirmación
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Para cancelar tu suscripción, realiza una petición POST a este endpoint con tu email',
      email: normalizedEmail
    });
  }

  const db = new Database();
  const mailer = new Mailer();

  try {
    await db.connect();

    // Verificar si el usuario existe
    const existingUser = await db.getUser(normalizedEmail);
    
    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'Este email no está suscrito' 
      });
    }

    // Eliminar usuario
    await db.run('DELETE FROM users WHERE email = ?', [normalizedEmail]);
    
    // Enviar email de confirmación
    try {
      await mailer.sendUnsubscribeConfirmation(normalizedEmail);
    } catch (emailError) {
      console.error('Error enviando confirmación:', emailError.message);
      // No fallar el unsubscribe si falla el email
    }

    console.log(`✅ Unsubscribe: ${normalizedEmail}`);

    res.status(200).json({ 
      success: true, 
      message: 'Suscripción cancelada exitosamente' 
    });

  } catch (error) {
    console.error('Error en unsubscribe:', error.message);

    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });

  } finally {
    await db.close();
  }
}