require('dotenv').config();
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

exports.register = async (req, res) => {
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
};

exports.login = async (req, res) => {
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
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en login' });
  }
};

exports.getAllUsers = async (req, res) => {
  const { exclude } = req.query;
  try {
    const result = await pool.query(
      'SELECT id, username, role FROM users WHERE username != $1',
      [exclude]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ message: 'Rol actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};
