import crypto from 'crypto';

// Rate limiting simple en memoria (para producción usar Redis)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

function getRateLimitKey(req) {
  // Usar IP del cliente
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  return ip;
}

function isRateLimited(key) {
  const attempts = loginAttempts.get(key);
  if (!attempts) return false;
  
  if (attempts.count >= MAX_ATTEMPTS) {
    const timeLeft = attempts.lockoutUntil - Date.now();
    if (timeLeft > 0) {
      return timeLeft;
    } else {
      // Reset después del lockout
      loginAttempts.delete(key);
      return false;
    }
  }
  return false;
}

function recordFailedAttempt(key) {
  const attempts = loginAttempts.get(key) || { count: 0, lockoutUntil: 0 };
  attempts.count++;
  
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockoutUntil = Date.now() + LOCKOUT_TIME;
  }
  
  loginAttempts.set(key, attempts);
}

function clearFailedAttempts(key) {
  loginAttempts.delete(key);
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const rateLimitKey = getRateLimitKey(req);
  const lockoutTime = isRateLimited(rateLimitKey);
  
  if (lockoutTime) {
    return res.status(429).json({ 
      message: 'Too many failed attempts. Try again later.',
      lockoutTime: Math.ceil(lockoutTime / 1000 / 60) // minutos restantes
    });
  }

  const { password } = req.body;
  
  // Validar que se envió una contraseña
  if (!password || typeof password !== 'string') {
    recordFailedAttempt(rateLimitKey);
    return res.status(400).json({ message: 'Password required' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Verificar que la variable de entorno está configurada
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // Comparación segura para evitar timing attacks
  const isValidPassword = crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(adminPassword)
  );

  if (isValidPassword) {
    // Limpiar intentos fallidos al loguearse correctamente
    clearFailedAttempts(rateLimitKey);
    
    // Generar token de sesión seguro
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Set httpOnly cookie for authentication
    res.setHeader('Set-Cookie', [
      `adminAuth=${sessionToken}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    ]);
    
    // Crear JWT token seguro para admin session (persiste en server restarts)
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ 
        success: false, 
        error: 'Configuración del servidor incompleta' 
      });
    }
    
    const adminToken = jwt.sign(
      { 
        role: 'admin',
        sessionId: sessionToken,
        timestamp: Date.now()
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
    
    res.status(200).json({ success: true });
  } else {
    recordFailedAttempt(rateLimitKey);
    
    // Log intento de acceso fallido
    console.warn(`Failed admin login attempt from IP: ${rateLimitKey} at ${new Date().toISOString()}`);
    
    res.status(401).json({ message: 'Invalid password' });
  }
}