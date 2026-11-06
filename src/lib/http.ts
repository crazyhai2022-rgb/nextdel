import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function json(data: unknown, init?: number | ResponseInit) {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function handleError(err: unknown) {
  if (err instanceof HttpError) return jsonError(err.message, err.status);
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return jsonError(first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input", 422);
  }
  console.error("[api] unexpected error", err);
  return jsonError("Something went wrong. Please try again.", 500);
}

export function clientIp(req: Request): string | null {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64);
  return (h.get("x-real-ip") || h.get("cf-connecting-ip") || null)?.slice(0, 64) ?? null;
}

/** CSRF defence for cookie-authenticated mutations: require same-origin Origin/Referer. */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (!origin) throw new HttpError(403, "Missing origin");
  let o: URL;
  try {
    o = new URL(origin);
  } catch {
    throw new HttpError(403, "Bad origin");
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host || o.host !== host) throw new HttpError(403, "Cross-origin request blocked");
}
