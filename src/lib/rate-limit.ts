import { HttpError } from "./http";

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

/**
 * Simple fixed-window in-memory limiter. Hostinger Node.js apps run a single process,
 * so this is effective there. For multi-instance deployments, swap for Redis.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
  } else {
    b.count++;
    if (b.count > limit) {
      throw new HttpError(429, "Too many requests. Please wait a moment and try again.");
    }
  }
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  }
}
