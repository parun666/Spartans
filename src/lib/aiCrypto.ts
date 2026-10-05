import crypto from "crypto";

function getKey() {
  const secret = process.env.AI_KEY_SECRET;
  if (!secret) throw new Error("AI_KEY_SECRET must be configured");
  if (secret.length < 32) throw new Error("AI_KEY_SECRET must be at least 32 characters");
  return crypto.createHash("sha256").update(secret).digest();
}
const AI_KEY = getKey();

export function encryptKey(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", AI_KEY, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]).toString("base64");
}
export function decryptKey(cipherB64: string): string {
  const buf = Buffer.from(cipherB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", AI_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
export function maskKey(cipherB64: string): string {
  try {
    const plain = decryptKey(cipherB64);
    return plain.length <= 8 ? "••••" : `${plain.slice(0, 4)}••••${plain.slice(-4)}`;
  } catch { return "••••"; }
}
