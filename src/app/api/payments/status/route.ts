import { prisma } from "@/lib/db";
import { clientIp, json, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { syncOrderWithGateway } from "@/lib/payments/fulfill";

const lastSync = new Map<string, number>();

/** Polled by the processing page. Status is always confirmed with the gateway server-side. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token.length < 20 || token.length > 64) return jsonError("Invalid token", 400);
  try {
    rateLimit(`status:${clientIp(req)}`, 60, 60_000);
  } catch {
    return jsonError("Too many requests", 429);
  }
  const order = await prisma.order.findUnique({ where: { accessToken: token }, select: { id: true, status: true, orderNumber: true } });
  if (!order) return jsonError("Order not found", 404);
  let status = order.status;
  if (status === "PENDING" || status === "PAYMENT_INITIATED" || status === "FAILED") {
    const last = lastSync.get(order.id) ?? 0;
    if (Date.now() - last > 4000) {
      lastSync.set(order.id, Date.now());
      status = (await syncOrderWithGateway(order.id, "POLL")) ?? status;
    }
  }
  return json({ ok: true, status, orderNumber: order.orderNumber });
}
