import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // In production, failed queries are logged once by logDbError() or by Next.js itself.
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const lastLogged = new Map<string, number>();

/**
 * Logs a database failure to the server console (visible in Hostinger runtime logs),
 * at most once per minute per context so a dead database doesn't flood the log.
 */
export function logDbError(context: string, err: unknown): void {
  const now = Date.now();
  if (now - (lastLogged.get(context) ?? 0) < 60_000) return;
  lastLogged.set(context, now);
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[nextdel] Database error while ${context}: ${message.trim().split("\n").slice(-3).join(" ")}`);
}

/** Runs a read-only query for a public page; on failure logs it and returns `fallback`. */
export async function safeQuery<T>(context: string, fn: () => Promise<T>, fallback: T): Promise<{ data: T; ok: boolean }> {
  try {
    return { data: await fn(), ok: true };
  } catch (err) {
    logDbError(context, err);
    return { data: fallback, ok: false };
  }
}
