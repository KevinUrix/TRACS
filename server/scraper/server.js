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
  try {
    const result = await pool.query('SELECT id, username, role FROM users');
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


// Inicia el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
