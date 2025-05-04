const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const getOAuth2Client = async () => {
  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const tokensPath = path.join(__dirname, '../data/googleTokens.json');
  const dirPath = path.dirname(tokensPath);

  // Asegurar que la carpeta exista
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  try {
    const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));

    if (!tokens || !tokens.access_token || !tokens.refresh_token) {
      throw new Error('No se encontraron tokens de Google');
    }

    const now = Date.now();
    const bufferTime = 60 * 1000; // 1 minuto de margen

    if (tokens.expiry_date && tokens.expiry_date <= now + bufferTime) {
      console.log('El access_token está caducado o por caducar, renovando...');

      // Refrescar el access_token usando el refresh_token
      const { tokens: newTokens } = await oAuth2Client.refreshToken(tokens.refresh_token);

      // Asegurar que el refresh_token anterior se conserve si no se devuelve en la respuesta
      newTokens.refresh_token = newTokens.refresh_token || tokens.refresh_token;

      oAuth2Client.setCredentials(newTokens);
      await fs.promises.writeFile(tokensPath, JSON.stringify(newTokens, null, 2));
      console.log('Tokens renovados correctamente');
    } else {
      oAuth2Client.setCredentials(tokens);
    }
  } catch (err) {
    console.error('Error al cargar o renovar los tokens:', err);
    throw new Error('No se pudieron cargar los tokens');
  }

  return oAuth2Client;
};

module.exports = { getOAuth2Client };
