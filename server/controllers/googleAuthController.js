const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const generateAuthUrl = () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: process.env.GOOGLE_CALENDAR_SCOPES?.split(',') || [
      'https://www.googleapis.com/auth/calendar',
    ],
  });
  return authUrl;
};

const handleGoogleCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Código de autorización no proporcionado');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.refresh_token) {
      const oldTokens = await getSavedTokens();
      tokens.refresh_token = oldTokens?.refresh_token || null;
    }

    if (!tokens || Object.keys(tokens).length === 0) {
      throw new Error('Tokens recibidos están vacíos');
    }

    const tokensFilePath = path.join(__dirname, '../data/googleTokens.json');
    await fs.promises.writeFile(tokensFilePath, JSON.stringify(tokens, null, 2));

    console.log('>> Tokens guardados exitosamente');
    return res.redirect('http://localhost:3000/calendario');
  } catch (error) {
    console.error('Error al obtener tokens:', error);
    if (!res.headersSent) {
      return res.status(500).send('Hubo un problema con la autenticación de Google');
    }
  }
};

const getSavedTokens = async () => {
  const tokensFilePath = path.join(__dirname, '../data/googleTokens.json');

  try {
    if (!fs.existsSync(tokensFilePath)) {
      console.error('El archivo googleTokens.json no existe');
      return null;
    }

    const fileContent = await fs.promises.readFile(tokensFilePath, 'utf-8');

    if (!fileContent || fileContent.trim().length === 0) {
      console.error('El archivo googleTokens.json está vacío');
      return null;
    }

    return JSON.parse(fileContent);
  } catch (error) {
    console.error('No se pudieron leer los tokens:', error.message);
    return null;
  }
};

module.exports = { generateAuthUrl, handleGoogleCallback, getSavedTokens };
