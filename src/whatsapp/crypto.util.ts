import * as crypto from 'crypto';

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const hex = process.env.WHATSAPP_SESSION_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'WHATSAPP_SESSION_ENCRYPTION_KEY must be set to a 64-char hex string (32 bytes) before connecting WhatsApp',
    );
  }
  return Buffer.from(hex, 'hex');
}

/** Encrypts a UTF-8 string, returning iv:authTag:ciphertext as a single hex string. */
export function encryptString(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

export function decryptString(payload: string): string {
  const [ivHex, authTagHex, dataHex] = payload.split(':');
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return decrypted.toString('utf8');
}
