const crypto = require('crypto');

const key = Buffer.from(process.env.ENCRYPTION_KEY_BASE64 || '', 'base64');
if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY_BASE64 debe ser una clave base64 de 32 bytes (256 bits).');
}

function encryptJson(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return {
    iv_b64: iv.toString('base64'),
    ct_b64: ciphertext.toString('base64'),
    tag_b64: tag.toString('base64'),
  };
}

function decryptJson(packet) {
  const iv = Buffer.from(packet.iv_b64, 'base64');
  const ct = Buffer.from(packet.ct_b64, 'base64');
  const tag = Buffer.from(packet.tag_b64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}

module.exports = { encryptJson, decryptJson };
