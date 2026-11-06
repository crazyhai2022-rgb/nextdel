import { safeEqual } from "@/lib/crypto";
import { json, jsonError } from "@/lib/http";
import { reconcilePendingOrders } from "@/lib/payments/fulfill";

export const dynamic = "force-dynamic";

/** Hostinger cron: curl -s "https://yourdomain.com/api/cron/reconcile?key=CRON_SECRET" (every 15 minutes) */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? req.headers.get("x-cron-key") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || !key || !safeEqual(key, secret)) return jsonError("Unauthorized", 401);
  return json({ ok: true, ...(await reconcilePendingOrders(100)) });
}
