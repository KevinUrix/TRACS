const { pool } = require('../utils/db');

exports.getNotifications = async (req, res) => {
  const userId = req.query.user;
  const maxDays = parseInt(req.query.maxDays || '7', 10);

  if (userId === undefined || userId === null) {
    return res.status(400).json({ error: 'Falta userId' });
  }

  try {
    await pool.query(
      `
      UPDATE notifications
      SET seen_by = array_append(seen_by, $1)
      WHERE created_at < NOW() - ($2 || ' days')::interval
        AND NOT $1 = ANY(seen_by)
      `,
      [userId, maxDays]
    );

    const result = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE NOT $1 = ANY(seen_by)
        AND created_at >= NOW() - ($2 || ' days')::interval
      ORDER BY created_at ASC
      `,
      [userId, maxDays]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener notificaciones:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.markAsRead = async (req, res) => {
  const { userId, ids } = req.body;

  if (userId === undefined || userId === null || !ids || !Array.isArray(ids)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  try {
    await pool.query(
      `
      UPDATE notifications 
      SET seen_by = array_append(seen_by, $1) 
      WHERE id = ANY($2::int[]) AND NOT $1 = ANY(seen_by)
      `,
      [userId, ids]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Error al marcar notificaciones:', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
};
