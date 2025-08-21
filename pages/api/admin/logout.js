export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sessionToken = req.cookies.adminAuth;
  
  if (sessionToken && global.adminSessions) {
    // Remover token de sesiones activas
    global.adminSessions.delete(sessionToken);
  }
  
  // Limpiar cookie
  res.setHeader('Set-Cookie', [
    `adminAuth=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${
      process.env.NODE_ENV === 'production' ? '; Secure' : ''
    }`
  ]);
  
  res.status(200).json({ success: true });
}