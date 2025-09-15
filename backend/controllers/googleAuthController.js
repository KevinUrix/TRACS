const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const { pool } = require('../utils/db');


const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);


//
// Generación de URL para autenticación
//
const generateAuthUrl = (username) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: process.env.GOOGLE_CALENDAR_SCOPES?.split(',') || [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
    state: username // sigue enviando username como identificador desde el frontend
  });
  return authUrl;
};


//
// Callback después del login con Google
//
const handleGoogleCallback = async (req, res) => {
  const { code, state } = req.query;
  const username = state;

  if (!code) {
    return res.status(400).send('Código de autorización no proporcionado');
  }

  try {
    // Buscar user_id por username
    const { rows: userRows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (!userRows.length) {
      return res.status(404).send('Usuario no encontrado');
    }
    const userId = userRows[0].id;

    // Intercambio de código por tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Carga tokens previos si existen
    const oldTokens = await getSavedTokens(userId);

    // Si no viene refresh_token, intenta reutilizar el guardado
    if (!tokens.refresh_token && oldTokens?.refresh_token) {
      tokens.refresh_token = oldTokens.refresh_token;
    } else if (!tokens.refresh_token) {
      throw new Error('No se obtuvo refresh_token y no hay uno guardado anteriormente');
    }

    if (!tokens || Object.keys(tokens).length === 0) {
      throw new Error('Tokens recibidos están vacíos');
    }

    const now = Date.now();
    const expiresIn = tokens.expires_in ? tokens.expires_in * 1000 : 3600 * 1000;
    const expiryDate = now + expiresIn;

    // Inserta o actualiza los tokens en la base de datos
    await pool.query(`
      INSERT INTO google_tokens (user_id, access_token, refresh_token, expiry_date, token_type, scope)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expiry_date = EXCLUDED.expiry_date,
        token_type = EXCLUDED.token_type,
        scope = EXCLUDED.scope,
        updated_at = NOW()
    `, [
      userId,
      tokens.access_token,
      tokens.refresh_token,
      expiryDate,
      tokens.token_type || null,
      tokens.scope || null
    ]);

    console.log('>> Tokens guardados exitosamente en la base de datos');
    return res.redirect(`${process.env.FRONTEND_URL}?fromGoogle=true`);
  } catch (error) {
    console.error('Error al obtener tokens:', error.message);
    if (!res.headersSent) {
      return res.status(500).send('Hubo un problema con la autenticación de Google');
    }
  }
};


//
// Obtiene Tokens guardados desde la base de datos (por user_id)
//
const getSavedTokens = async (userId) => {
  try {
    const { rows } = await pool.query('SELECT * FROM google_tokens WHERE user_id = $1', [userId]);
    return rows[0] || null;
  } catch (error) {
    console.error('No se pudieron leer los tokens desde la base de datos:', error.message);
    return null;
  }
};


//
// Reautentica al usuario si los tokens son inválidos o caducaron mal
//
const reauth = async (req, res) => {
  const { user: username } = req.query;

  try {
    // Buscar user_id por username
    const { rows: userRows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (!userRows.length) {
      return res.status(404).send('Usuario no encontrado');
    }
    const userId = userRows[0].id;

    // Elimina tokens previos del usuario
    await pool.query('DELETE FROM google_tokens WHERE user_id = $1', [userId]);
    console.log(`Tokens de ${username} eliminados para reautenticación`);

    // Redirige a la URL de autenticación
    const authUrl = generateAuthUrl(username);
    res.redirect(authUrl);

  } catch (error) {
    console.error('Error al eliminar tokens desde la base de datos:', error.message);
    return res.status(500).send('No se pudo reautenticar al usuario');
  }
};

module.exports = { generateAuthUrl, handleGoogleCallback, getSavedTokens, reauth };
