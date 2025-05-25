const express = require('express');
const cors = require('cors');
const scheduleRoutes = require('../routes/scheduleRoutes');
const downloadRoutes = require('../routes/downloadRoutes');
const searchRoutes = require('../routes/searchRoutes');
const reservationsRoutes = require('../routes/reservationsRoutes')
const classroomsRoutes = require('../routes/classroomsRoutes');
const localScheduleRoutes = require( '../routes/localScheduleRoutes');
const cyclesRoutes = require( '../routes/cyclesRoutes');
const buildingsRoutes = require( '../routes/buildingsRoutes');
const googleAuthRoutes = require('../routes/googleAuthRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
require('dotenv').config();

// Para SQL
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: 5432,
});

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', scheduleRoutes);
app.use('/api', downloadRoutes);
app.use('/api', searchRoutes);
app.use('/api', reservationsRoutes);
app.use('/api', classroomsRoutes);
app.use('/api', localScheduleRoutes);
app.use('/api', cyclesRoutes);
app.use('/api', buildingsRoutes);
app.use('/api/google', googleAuthRoutes);


/*---------------- SQL -----------------------*/
// Ruta para registrar usuario
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese usuario se encuentra en uso. Seleccione otro.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, result.rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    //const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en login' });
  }
});

// Obtenemos todos lo usuarios de la tabla users.
app.get('/api/users', async (req, res) => {
  const {exclude} = req.query;
  try {
    const result = await pool.query("SELECT id, username, role FROM users WHERE username != $1", [exclude]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Cambiamos el rol del usuario seleccionado.
app.put('/api/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ message: 'Rol actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
});

// Eliminar usuario por ID
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

/*---------------------------- Tickets --------------------------------*/

// Crear un ticket nuevo
app.post('/api/tickets', async (req, res) => {
  const { building, room, title, category, priority, report, created_by } = req.body;

  if (!building || !report || !title || !priority || !category || !created_by) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tickets (building, room, title, category, priority, report, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [building, room || null, title, category, priority, report, created_by]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al guardar ticket:', err);
    res.status(500).json({ error: 'Error al guardar el ticket' });
  }
});

// Obtener todos los tickets (sin filtro de edificio)
app.get('/api/tickets', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tickets ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener todos los tickets:', err);
    res.status(500).json({ error: 'Error al obtener los tickets' });
  }
});


// Obtener tickets filtrados por edificio
app.get('/api/tickets/:building', async (req, res) => {
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
});

// Actualizar un ticket existente
app.put('/api/tickets/:id', async (req, res) => {
  const { id } = req.params;
  const {
    room,
    report,
    status,
    category,
    modified_by,  // nuevo campo
  } = req.body;

  if (!report) {
    return res.status(400).json({ error: 'El campo "report" es obligatorio' });
  }

  try {
    // Ver si el estado cambió para actualizar el campo status_changed_at
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
        report = $2,
        status = $3,
        category = $4,
        modified_by = $5,
        status_changed_at = CASE WHEN $6 THEN $7 ELSE status_changed_at END
      WHERE id = $8
      RETURNING *`,
      [room || null, report, status, category, modified_by, statusChanged, statusChangedAt, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar ticket:', err);
    res.status(500).json({ error: 'Error al actualizar ticket' });
  }
});

// Eliminar un ticket por ID
app.delete('/api/tickets/:id', async (req, res) => {
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
});




// Inicia el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
