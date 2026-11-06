import path from "node:path";

const DEV_SITE_URL = "http://localhost:3000";

/** Public base URL without trailing slash. Never throws (a bad value must not take the site down). */
export function siteUrl(): string {
  const raw = (process.env.SITE_URL || "").trim();
  if (!raw) return DEV_SITE_URL;
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProto).origin;
  } catch {
    return DEV_SITE_URL;
  }
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

// ─── Startup configuration check ────────────────────────────────────────────

export type EnvIssue = { level: "error" | "warn"; variable: string; message: string };

/** Text from the README / .env.example / secrets template that must be replaced before going live. */
const PLACEHOLDERS = [
  "DB_USER", "DB_PASSWORD", "DB_HOST", "DB_NAME", "YOUR_DB_PASSWORD", "USER:PASSWORD", "DBNAME",
  "YOUR_HOSTINGER_USER", "YOUR-DOMAIN", "yourdomain.com", "u123456789", "change-me",
];

function placeholderIn(value: string): string | undefined {
  return PLACEHOLDERS.find((p) => value.includes(p));
}

/**
 * Checks the server environment and returns every problem found. Never throws and
 * never includes secret values in its messages.
 */
export function checkEnv(env: NodeJS.ProcessEnv = process.env): EnvIssue[] {
  const issues: EnvIssue[] = [];
  const prod = env.NODE_ENV === "production";
  const add = (level: EnvIssue["level"], variable: string, message: string) => issues.push({ level, variable, message });

  // DATABASE_URL
  const db = (env.DATABASE_URL || "").trim();
  if (!db) {
    add("error", "DATABASE_URL", "is not set. Expected mysql://USER:PASSWORD@HOST:3306/DATABASE");
  } else if (placeholderIn(db)) {
    add("error", "DATABASE_URL", `still contains the placeholder "${placeholderIn(db)}". Replace it with your real Hostinger MySQL user, password, host and database name.`);
  } else if (!/^mysql:\/\//i.test(db)) {
    add("error", "DATABASE_URL", "must start with mysql:// (prisma/schema.prisma uses the MySQL provider).");
  } else {
    try {
      const u = new URL(db);
      if (!u.username || !u.hostname || u.pathname.length < 2) {
        add("error", "DATABASE_URL", "is incomplete. Expected mysql://USER:PASSWORD@HOST:3306/DATABASE");
      }
    } catch {
      add("error", "DATABASE_URL", "is not a valid URL. URL-encode special characters in the password (@ → %40, # → %23, / → %2F, : → %3A, ? → %3F, & → %26).");
    }
  }

  // APP_SECRET
  const secret = env.APP_SECRET || "";
  if (!secret) add(prod ? "error" : "warn", "APP_SECRET", "is not set. Use a random value of 64+ characters.");
  else if (secret.startsWith("change-me")) add(prod ? "error" : "warn", "APP_SECRET", "is still the example value. Use a random value of 64+ characters.");
  else if (secret.length < 32) add(prod ? "error" : "warn", "APP_SECRET", `is too short (${secret.length} characters). Use 64+ characters.`);

  // STORAGE_DIR
  const storage = (env.STORAGE_DIR || "").trim();
  if (!storage) {
    if (prod) add("warn", "STORAGE_DIR", "is not set, so uploads go inside the app folder and can be lost on redeploy. Use e.g. /home/<your-hostinger-user>/nextdel-storage");
  } else if (placeholderIn(storage)) {
    add("error", "STORAGE_DIR", `still contains the placeholder "${placeholderIn(storage)}". Use your real home path, e.g. /home/<your-hostinger-user>/nextdel-storage`);
  } else if (prod && !path.isAbsolute(storage)) {
    add("warn", "STORAGE_DIR", "is a relative path. Use an absolute path outside the app folder so uploads survive redeploys.");
  }

  // SITE_URL
  const site = (env.SITE_URL || "").trim();
  if (!site) {
    if (prod) add("warn", "SITE_URL", "is not set. Emails, webhooks and the sitemap will use http://localhost:3000.");
  } else if (placeholderIn(site)) {
    add("warn", "SITE_URL", `still contains the placeholder "${placeholderIn(site)}". Use your real domain, e.g. https://example.com`);
  } else if (!/^https?:\/\//i.test(site)) {
    add("warn", "SITE_URL", "should start with https:// (assuming https).");
  }

  // CRON_SECRET / ADMIN_SETUP_TOKEN
  if (prod && !env.CRON_SECRET) add("warn", "CRON_SECRET", "is not set, so /api/cron/reconcile is disabled.");
  if (env.ADMIN_SETUP_TOKEN && env.ADMIN_SETUP_TOKEN.length < 16) {
    add("warn", "ADMIN_SETUP_TOKEN", "is shorter than 16 characters. Use a long random value and delete it after creating the admin.");
  }

  return issues;
}

/** Logs the result of checkEnv() in a format that is easy to spot in hosting logs. */
export function logEnvReport(issues: EnvIssue[] = checkEnv()): void {
  if (!issues.length) {
    console.log("[nextdel] Environment check passed.");
    return;
  }
  for (const i of issues) {
    const line = `[nextdel] ENV ${i.level.toUpperCase()}: ${i.variable} ${i.message}`;
    if (i.level === "error") console.error(line);
    else console.warn(line);
  }
  const errors = issues.filter((i) => i.level === "error").length;
  if (errors) console.error(`[nextdel] ${errors} environment problem(s) found. Pages that need the database will show a fallback until they are fixed.`);
}
