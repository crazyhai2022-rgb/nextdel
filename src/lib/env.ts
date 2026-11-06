import path from "node:path";

export function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export function appSecret(): string {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32 || s.startsWith("change-me")) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APP_SECRET is missing or too short. Set a 64+ character random value.");
    }
    return "dev-only-insecure-secret-dev-only-insecure-secret";
  }
  return s;
}

export function storageDir(): string {
  const dir = process.env.STORAGE_DIR || "./storage";
  return path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
}

export const isProd = process.env.NODE_ENV === "production";
