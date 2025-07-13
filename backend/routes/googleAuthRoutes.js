const express = require('express');
const router = express.Router();
const { generateAuthUrl, handleGoogleCallback, getSavedTokens, reauth } = require('../controllers/googleAuthController');
const { pool } = require('../utils/db');

// const { createEvent } = require('../controllers/googleEventController');

// Ruta para generar la URL de autorización de Google
router.get('/auth', (req, res) => {
  const { user } = req.query;
  if (!user) return res.status(400).send('Falta parámetro "user"');

  const authUrl = generateAuthUrl(user);
  res.redirect(authUrl);
});

// Ruta de callback para recibir el código y obtener los tokens
router.get('/oauth2callback', handleGoogleCallback);

// Ruta para verificar si el usuario está autenticado (tokens guardados)
router.get('/status', async (req, res) => {
  const { user } = req.query;
  if (!user) return res.status(400).json({ authenticated: false, error: 'Usuario no especificado' });

  // Buscar user_id por username
  const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [user]);
  if (!rows.length) throw new Error('Usuario no encontrado');
  const userId = rows[0].id;

  const tokens = await getSavedTokens(userId);
  if (tokens && tokens.access_token) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

router.get('/reauth', reauth);

// // Ruta para crear un evento en Google Calendar
// router.post('/create-event', createEvent);

module.exports = router;
