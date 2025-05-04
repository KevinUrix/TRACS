const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();


const getOAuth2Client = () => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Ruta donde se guardan los tokens de Google
  const tokensPath = path.join(__dirname, '../data/googleTokens.json');
  const dirPath = path.dirname(tokensPath);

  // Verificar si la carpeta existe, si no, crearla
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });  // Crear la carpeta si no existe
  }

  try {
    // Intentar leer los tokens guardados
    const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    oAuth2Client.setCredentials(tokens);
  } catch (err) {
    console.error('Error al cargar los tokens guardados:', err);
  }

  return oAuth2Client;
};

module.exports = { getOAuth2Client };
