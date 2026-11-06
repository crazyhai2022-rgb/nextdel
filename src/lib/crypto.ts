import crypto from "node:crypto";
import { appSecret } from "./env";

function deriveKey(purpose: string): Buffer {
  return crypto.createHash("sha256").update(`${appSecret()}::${purpose}`).digest();
}

/** AES-256-GCM encryption for secrets stored in the database. */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey("enc"), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const [v, ivB, tagB, encB] = payload.split(":");
    if (v !== "v1") return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", deriveKey("enc"), Buffer.from(ivB, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encB, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function hmacHex(key: string | Buffer, data: string): string {
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Signs short-lived download URLs. */
export function signDownload(orderId: string, downloadId: string, expires: number): string {
  return hmacHex(deriveKey("download"), `${orderId}.${downloadId}.${expires}`);
}

export function verifyDownloadSignature(orderId: string, downloadId: string, expires: number, sig: string): boolean {
  if (!sig || Date.now() / 1000 > expires) return false;
  return safeEqual(signDownload(orderId, downloadId, expires), sig);
}

/** Masks a secret for display: "rzp_test_••••4f2a" */
export function maskSecret(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 6) return "••••••";
  return `${"•".repeat(8)}${value.slice(-4)}`;
}
