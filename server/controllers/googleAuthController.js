const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);


//
// Generación de URL para autenticación
//
const generateAuthUrl = (user) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: process.env.GOOGLE_CALENDAR_SCOPES?.split(',') || [
      'https://www.googleapis.com/auth/calendar',
    ],
    state: user,
  });
  return authUrl;
};


//
// Callback
//
const handleGoogleCallback = async (req, res) => {
  const { code, state } = req.query;
  const user = state;

  if (!code) {
    return res.status(400).send('Código de autorización no proporcionado');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oldTokens = await getSavedTokens(user);

    if (!tokens.refresh_token && oldTokens?.refresh_token) {
      tokens.refresh_token = oldTokens.refresh_token;
    } else if (!tokens.refresh_token) {
      throw new Error('No se obtuvo refresh_token y no hay uno guardado anteriormente');
    }


    if (!tokens || Object.keys(tokens).length === 0) {
      throw new Error('Tokens recibidos están vacíos');
    }

    const tokensFilePath = path.join(__dirname, `../data/tokens/${user}Tokens.json`);
    await fs.promises.writeFile(tokensFilePath, JSON.stringify(tokens, null, 2));

    console.log('>> Tokens guardados exitosamente');
    return res.redirect('http://localhost:3000/?fromGoogle=true');
  } catch (error) {
    console.error('Error al obtener tokens:', error);
    if (!res.headersSent) {
      return res.status(500).send('Hubo un problema con la autenticación de Google');
    }
  }
};


//
// Obtener Tokens
//
const getSavedTokens = async (user) => {
  const tokensFilePath = path.join(__dirname, `../data/tokens/${user}Tokens.json`);

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

//
// Reautentica al usuario en caso de tokens malos
//
const reauth = (req, res) => {
  const { user } = req.query;
  const tokensFilePath = path.join(__dirname, `../data/tokens/${user}Tokens.json`);
  if (fs.existsSync(tokensFilePath)) {
    fs.unlinkSync(tokensFilePath);
  }
  const authUrl = generateAuthUrl(user);
  res.redirect(authUrl);
};


module.exports = { generateAuthUrl, handleGoogleCallback, getSavedTokens, reauth };
