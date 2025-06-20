require('dotenv').config();
const { Pool } = require('pg');
const { classifyTicket } = require('../utils/aiClassifier');


const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: 5432,
});

exports.createTicket = async (req, res) => {
  const { building, room, title, report, created_by } = req.body;
  const { category, secondaryCategory, priority } = classifyTicket({ building, room, title, report });
  const fullCategory = secondaryCategory ? `${category} (${secondaryCategory})` : category;

  // const { building, room, title, category, priority, report, created_by } = req.body;

  if (!building || !report || !title || !priority || !fullCategory || !created_by) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tickets (building, room, title, category, priority, report, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [building, room || null, title, fullCategory, priority, report, created_by]
    );

    const newTicket = result.rows[0];

    // Emitimos evento a los clientes conectados
    const io = req.app.get('io');
    io.emit('new-ticket', newTicket); // Evento global
    
    res.status(201).json(newTicket);
  } catch (err) {
    console.error('Error al guardar ticket:', err);
    res.status(500).json({ error: 'Error al guardar el ticket' });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tickets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener todos los tickets:', err);
    res.status(500).json({ error: 'Error al obtener los tickets' });
  }
};

exports.getTicketsByBuilding = async (req, res) => {
  const { building } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM tickets WHERE building = $1 ORDER BY created_at DESC',
      [building]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener tickets:', err);
    res.status(500).json({ error: 'Error al obtener tickets' });
  }
};

exports.updateTicket = async (req, res) => {
  const { id } = req.params;
  const { room, title, report, status, category, priority, modified_by } = req.body;

  if (!report) {
    return res.status(400).json({ error: 'El campo "report" es obligatorio' });
  }

  try {
    const previous = await pool.query('SELECT status FROM tickets WHERE id = $1', [id]);

    if (previous.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const prevStatus = previous.rows[0].status;
    const statusChanged = status && status !== prevStatus;
    const statusChangedAt = statusChanged ? new Date() : null;

    const result = await pool.query(
      `UPDATE tickets SET
        room = $1,
        title = $2,
        report = $3,
        status = $4,
        category = $5,
        priority = $6,
        modified_by = $7,
        status_changed_at = CASE WHEN $8 THEN $9 ELSE status_changed_at END
      WHERE id = $10
      RETURNING *`,
      [room || null,title, report, status, category, priority, modified_by, statusChanged, statusChangedAt, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar ticket:', err);
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
};

exports.deleteTicket = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json({ message: 'Ticket eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar ticket:', err);
    res.status(500).json({ error: 'Error al eliminar el ticket' });
  }
};
