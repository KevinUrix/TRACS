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

  // Asegura que la carpeta exista
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  try {
    const rawData = fs.readFileSync(tokensPath, 'utf-8');

    if (!rawData.trim()) {
      throw new Error('El archivo de tokens está vacío');
    }

    const tokens = JSON.parse(rawData);

    if (!tokens || !tokens.access_token || !tokens.refresh_token) {
      throw new Error('No se encontraron tokens de Google');
    }

    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutos de buffer para asegurar la renovación
    
    // **Fix del expiry_date**:
    if (!tokens.expiry_date || tokens.expiry_date < now) {
      console.log('expiry_date inválido o expirado. Renovando...');

      // Refresca el access_token usando el refresh_token
      const { tokens: newTokens } = await oAuth2Client.refreshToken(tokens.refresh_token);

      // Asegura que el refresh_token se conserve si no se devuelve
      newTokens.refresh_token = newTokens.refresh_token || tokens.refresh_token;

      // Calcula un nuevo expiry_date si no viene en la respuesta
      const expiresIn = newTokens.expires_in ? newTokens.expires_in * 1000 : 3600 * 1000;
      newTokens.expiry_date = now + expiresIn;

      oAuth2Client.setCredentials(newTokens);

      // Guarda los tokens actualizados correctamente
      await fs.promises.writeFile(tokensPath, JSON.stringify(newTokens, null, 2));
      console.log('Tokens renovados correctamente');
    } else if (tokens.expiry_date <= now + bufferTime) {
      console.log('El access_token está por caducar, renovando...');

      const { tokens: newTokens } = await oAuth2Client.refreshToken(tokens.refresh_token);
      newTokens.refresh_token = newTokens.refresh_token || tokens.refresh_token;
      const expiresIn = newTokens.expires_in ? newTokens.expires_in * 1000 : 3600 * 1000;
      newTokens.expiry_date = now + expiresIn;

      oAuth2Client.setCredentials(newTokens);
      await fs.promises.writeFile(tokensPath, JSON.stringify(newTokens, null, 2));
      console.log('Tokens renovados correctamente');
    } else {
      oAuth2Client.setCredentials(tokens);
    }

  } catch (err) {
    console.error('Error al cargar o renovar los tokens:', err.message);
    throw new Error('No se pudieron cargar los tokens');
  }

  return oAuth2Client;
};

module.exports = { getOAuth2Client };