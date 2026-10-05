import crypto from "crypto";

const key = crypto.createHash("sha256").update(process.env.AI_KEY_SECRET ?? "dev-only-ai-secret-0123456789abcdef0123").digest();

export function encryptKey(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]).toString("base64");
}
export function decryptKey(cipherB64: string): string {
  const buf = Buffer.from(cipherB64, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
export function maskKey(cipherB64: string): string {
  try {
    const plain = decryptKey(cipherB64);
    return plain.length <= 8 ? "••••" : `${plain.slice(0, 4)}••••${plain.slice(-4)}`;
  } catch { return "••••"; }
}
