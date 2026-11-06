// Node.js-only startup checks, loaded from instrumentation.ts.
import fs from "node:fs/promises";
import path from "node:path";
import { checkEnv, logEnvReport, storageDir } from "./lib/env";

export async function runStartupChecks() {
  const issues = checkEnv();
  logEnvReport(issues);

  // Make sure the upload folders exist (fails loudly in the log, never crashes the server).
  if (!issues.some((i) => i.variable === "STORAGE_DIR" && i.level === "error")) {
    const base = storageDir();
    try {
      await Promise.all(["public", "private"].map((v) => fs.mkdir(path.join(base, v), { recursive: true })));
    } catch (err) {
      console.error(`[nextdel] STORAGE_DIR ${base} is not writable:`, (err as Error).message);
    }
  }

  // Test the database connection in the background so the result shows up in the runtime logs.
  if (!issues.some((i) => i.variable === "DATABASE_URL")) {
    void (async () => {
      try {
        const { prisma } = await import("./lib/db");
        await prisma.$queryRaw`SELECT 1`;
        console.log("[nextdel] Database connection OK.");
      } catch (err) {
        console.error("[nextdel] Database connection FAILED:", (err as Error).message);
      }
    })();
  }
}
