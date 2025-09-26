const crypto = require('crypto');

const key = Buffer.from(process.env.STATE_HMAC_KEY_BASE64, 'base64');
if (key.length !== 32) {
  throw new Error('STATE_HMAC_KEY_BASE64 debe ser de 32 bytes en base64');
}

function signState(username) {
  const payload = JSON.stringify({ u: username, ts: Date.now() });
  const hmac = crypto.createHmac('sha256', key).update(payload).digest('base64url');
  return Buffer.from(JSON.stringify({ p: payload, s: hmac })).toString('base64url');
}

function verifyState(stateB64) {
  const raw = Buffer.from(stateB64, 'base64url').toString('utf8');
  const { p, s } = JSON.parse(raw);
  const mac = crypto.createHmac('sha256', key).update(p).digest('base64url');
  if (mac !== s) throw new Error('state inválido o manipulado');
  const { u } = JSON.parse(p);
  return u; // username
}

module.exports = { signState, verifyState };
