const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const { pool } = require('./db');
const { encryptJson, decryptJson } = require('./crypto');

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
    const { rows } = await pool.query(
      'SELECT token_encrypted FROM google_tokens WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    if (!rows.length) throw new Error('No se encontraron tokens en la base de datos');

    const row = rows[0];
    const packet = typeof row.token_encrypted === 'string'
      ? JSON.parse(row.token_encrypted)
      : row.token_encrypted;

    const safe = decryptJson(packet);

    if (!safe.access_token || !safe.refresh_token) {
      throw new Error('Tokens inválidos o incompletos');
    }

    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutos de buffer para renovación anticipada

    // Renovación del token si expiró o está por expirar
    if (!safe.expiry_date || safe.expiry_date < now || safe.expiry_date <= now + bufferTime) {
      console.log('El token ha expirado o está por caducar. Renovando...');

      const { tokens: newTokens } = await oAuth2Client.refreshToken(safe.refresh_token);
      const expiresIn = newTokens.expires_in ? newTokens.expires_in * 1000 : 3600 * 1000;
      const updated = {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || safe.refresh_token,
        token_type: newTokens.token_type || safe.token_type || null,
        scope: newTokens.scope || safe.scope || null,
        expiry_date: now + expiresIn
      };

      oAuth2Client.setCredentials(updated);

      const packet = encryptJson(updated);
      await pool.query(`
        UPDATE google_tokens
        SET token_encrypted = $1::jsonb, updated_at = NOW()
        WHERE user_id = $2
      `, [JSON.stringify(packet), userId]);

      console.log('Tokens renovados y re-cifrados correctamente');
    } else {

      // Token aún válido
      oAuth2Client.setCredentials({
        access_token: safe.access_token,
        refresh_token: safe.refresh_token,
        expiry_date: safe.expiry_date,
        token_type: safe.token_type || undefined,
        scope: safe.scope || undefined
      });
    }

  } catch (err) {
    console.error('Error al obtener o renovar los tokens desde la base de datos:', err.message);
    throw new Error('No se pudieron cargar los tokens');
  }

  return oAuth2Client;
};

module.exports = { getOAuth2Client };
