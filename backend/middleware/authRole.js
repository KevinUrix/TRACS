const { pool } = require('../utils/db');

function authRole(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const tokenTv = req.user.tv;

      const { rows } = await pool.query(
        'SELECT token_version, role FROM users WHERE id = $1',
        [userId]
      );
      if (!rows.length) return res.status(401).json({ message: 'Usuario no encontrado' });

      if (rows[0].token_version !== tokenTv) {
        return res.status(401).json({ message: 'Token desactualizado. Inicia sesión nuevamente.' });
      }

      const currentRole = rows[0].role;
      if (allowedRoles.length && !allowedRoles.includes(currentRole)) {
        return res.status(401).json({ message: 'No autorizado' });
      }

      req.user.role = currentRole;
      next();
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Error de servidor' });
    }
  };
}

module.exports = authRole;
