import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const AUTH_TAG_BYTES = 16;

export type EncryptedSlackWebhook = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

function encryptionKey(encodedKey = process.env.SLACK_TOKEN_ENCRYPTION_KEY): Buffer {
  if (!encodedKey) {
    throw new Error("SLACK_TOKEN_ENCRYPTION_KEY is required");
  }

  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32 || key.toString("base64") !== encodedKey) {
    throw new Error("SLACK_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  }

  return key;
}

export function encryptSlackWebhook(
  webhookUrl: string,
  encodedKey?: string,
): EncryptedSlackWebhook {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(encodedKey), iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  const ciphertext = Buffer.concat([cipher.update(webhookUrl, "utf8"), cipher.final()]);

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptSlackWebhook(
  encrypted: EncryptedSlackWebhook,
  encodedKey?: string,
): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    encryptionKey(encodedKey),
    Buffer.from(encrypted.iv, "base64"),
    { authTagLength: AUTH_TAG_BYTES },
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
