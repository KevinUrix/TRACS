require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../utils/db');

exports.register = async (req, res) => {
  const { username, password } = req.body;
  const usernameRegex = /^[a-z0-9_]{3,20}$/;
  const passwordRegex = /^[a-zA-Z0-9!@#$%^&*]{6,30}$/;

  
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Nombre de usuario inválido' });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'Contraseña inválida.' });
  }


  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese usuario se encuentra en uso.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const usernameRegex = /^[a-z0-9_]{3,20}$/;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Nombre de usuario inválido' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, result.rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    console.error(err.message);
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
    console.error('Error al eliminar usuario:', err.message);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// Obtiene datos del usuario actual
exports.getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT username, role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener usuario:', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Cambia nombre de usuario
exports.updateUsername = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newUsername } = req.body;

    const usernameRegex = /^[a-z0-9_]{3,20}$/;

    if (!usernameRegex.test(newUsername)) {
      return res.status(400).json({ error: 'Nombre de usuario inválido' });
    }

    const exists = await pool.query(
      'SELECT id FROM users WHERE username = $1 AND id <> $2',
      [newUsername, userId]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'Nombre de usuario ya está en uso' });
    }

    await pool.query(
      'UPDATE users SET username = $1 WHERE id = $2',
      [newUsername, userId]
    );

    res.json({ message: 'Nombre de usuario actualizado correctamente' });
  } catch (err) {
    console.error('Error al actualizar nombre de usuario:', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Cambia contraseña
exports.updatePassword = async (req, res) => {
  const passwordRegex = /^[a-zA-Z0-9!@#$%^&*]{6,30}$/;
  
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Datos faltantes' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Las nuevas contraseñas no coinciden' });
    }
    
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'Contraseña inválida.' });
    }

    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];

    // Verifica que la contraseña actual sea correcta
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    // Verifica que la nueva contraseña no sea la misma que la actual
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ message: 'La nueva contraseña no puede ser igual a la actual' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashed, userId]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error al actualizar contraseña:', err.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

