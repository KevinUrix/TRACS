const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const { pool } = require('./db');

//
// Obtiene el cliente OAuth con los tokens desde BD, buscando por username
//
const getOAuth2Client = async (username) => {
  if (!username) throw new Error('Usuario no especificado');

  // Instancia del cliente OAuth de Google
  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    // Busca el user_id por username
    const userResult = await pool.query('SELECT id FROM users WHERE username = $1 LIMIT 1', [username]);

    if (!userResult.rows.length) {
      throw new Error(`No se encontró el usuario con username "${username}"`);
    }

    const userId = userResult.rows[0].id;

    // Consulta los tokens desde la base de datos usando el ID
    const { rows } = await pool.query('SELECT * FROM google_tokens WHERE user_id = $1 LIMIT 1', [userId]);

    if (!rows.length) {
      throw new Error('No se encontraron tokens en la base de datos');
    }

    const tokens = rows[0];

    if (!tokens || !tokens.access_token || !tokens.refresh_token) {
      throw new Error('Tokens inválidos o incompletos');
    }

    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutos de buffer para renovación anticipada

    // Renovación del token si expiró o está por expirar
    if (!tokens.expiry_date || tokens.expiry_date < now || tokens.expiry_date <= now + bufferTime) {
      console.log('El token ha expirado o está por caducar. Renovando...');

      const { tokens: newTokens } = await oAuth2Client.refreshToken(tokens.refresh_token);

      newTokens.refresh_token = newTokens.refresh_token || tokens.refresh_token;
      const expiresIn = newTokens.expires_in ? newTokens.expires_in * 1000 : 3600 * 1000;
      newTokens.expiry_date = now + expiresIn;

      oAuth2Client.setCredentials(newTokens);

      await pool.query(`
        UPDATE google_tokens
        SET access_token = $1,
            refresh_token = $2,
            expiry_date = $3,
            updated_at = NOW()
        WHERE user_id = $4
      `, [
        newTokens.access_token,
        newTokens.refresh_token,
        newTokens.expiry_date,
        userId
      ]);

      console.log('Tokens renovados correctamente');
    } else {

      // Token aún válido
      oAuth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      });
    }

  } catch (err) {
    console.error('Error al obtener o renovar los tokens desde la base de datos:', err.message);
    throw new Error('No se pudieron cargar los tokens');
  }

  return oAuth2Client;
};

module.exports = { getOAuth2Client };
