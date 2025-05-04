const express = require('express');
const router = express.Router();
const { generateAuthUrl, handleGoogleCallback, getSavedTokens } = require('../controllers/googleAuthController');
// const { createEvent } = require('../controllers/googleEventController');

// Ruta para generar la URL de autorización de Google
router.get('/auth', (req, res) => {
  const authUrl = generateAuthUrl();
  res.redirect(authUrl);
});

// Ruta de callback para recibir el código y obtener los tokens
router.get('/oauth2callback', handleGoogleCallback);

// Ruta para verificar si el usuario está autenticado (tokens guardados)
router.get('/status', async (req, res) => {
  const tokens = await getSavedTokens();
  if (tokens && tokens.access_token) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// // Ruta para crear un evento en Google Calendar
// router.post('/create-event', createEvent);

module.exports = router;
