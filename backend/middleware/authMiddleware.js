const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token requerido' });
  
  // Verifica si el token tiene un formato correcto
  if (token.split('.').length !== 3) {
    return res.status(400).json({ message: 'Token malformado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Error al verificar token:', err.message);
    res.status(403).json({ message: 'Token inválido' });
  }
}

module.exports = authMiddleware;
