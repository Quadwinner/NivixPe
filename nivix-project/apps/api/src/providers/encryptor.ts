import * as crypto from 'node:crypto';
import { config } from '../config';

// Hosting-agnostic field encryption for PII at rest.
// Local AES-256-GCM with a master key now; AWS KMS envelope encryption later.
export interface Encryptor {
  encrypt(plaintext: Buffer | string): Buffer;
  decrypt(ciphertext: Buffer): Buffer;
}

// Layout: iv(12) | authTag(16) | ciphertext
export class LocalKeyEncryptor implements Encryptor {
  private readonly key: Buffer;

  constructor(masterKeyBase64: string) {
    if (!masterKeyBase64) {
      throw new Error(
        'LOCAL_MASTER_KEY is required (generate: openssl rand -base64 32)',
      );
    }
    this.key = Buffer.from(masterKeyBase64, 'base64');
    if (this.key.length !== 32) {
      throw new Error('LOCAL_MASTER_KEY must decode to exactly 32 bytes');
    }
  }

  encrypt(plaintext: Buffer | string): Buffer {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const input =
      typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
    const enc = Buffer.concat([cipher.update(input), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), enc]);
  }

  decrypt(ciphertext: Buffer): Buffer {
    const iv = ciphertext.subarray(0, 12);
    const tag = ciphertext.subarray(12, 28);
    const data = ciphertext.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  }
}

export function createEncryptor(): Encryptor {
  return new LocalKeyEncryptor(config.localMasterKey);
}
