import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { json } from "@/lib/http";
import { getGatewayConfig } from "@/lib/payments/gateway";
import { verifyCashfreeWebhook } from "@/lib/payments/cashfree";
import { markOrderFailed, markOrderPaid } from "@/lib/payments/fulfill";

export const dynamic = "force-dynamic";

type CfWebhook = {
  type?: string;
  data?: {
    order?: { order_id?: string };
    payment?: { cf_payment_id?: string | number; payment_status?: string; payment_amount?: number; payment_currency?: string; payment_group?: string; payment_message?: string };
  };
};

export async function POST(req: Request) {
  const raw = await req.text();
  const ts = req.headers.get("x-webhook-timestamp");
  const sig = req.headers.get("x-webhook-signature");
  const eventId = sha256(raw);

  const [test, live] = await Promise.all([getGatewayConfig("CASHFREE", "TEST"), getGatewayConfig("CASHFREE", "LIVE")]);
  const valid = verifyCashfreeWebhook(raw, ts, sig, live.webhookSecret) || verifyCashfreeWebhook(raw, ts, sig, test.webhookSecret);

  let event: CfWebhook = {};
  try {
    event = JSON.parse(raw);
  } catch {}

  const dup = await prisma.paymentWebhook.findUnique({ where: { gateway_eventId: { gateway: "CASHFREE", eventId } } });
  if (dup?.processed) return json({ ok: true, duplicate: true });
  const log = dup ?? (await prisma.paymentWebhook.create({
    data: { gateway: "CASHFREE", eventId, eventType: event.type?.slice(0, 80), signatureValid: valid, payload: raw.slice(0, 200000), orderNumber: event.data?.order?.order_id?.slice(0, 32) },
  }));
  if (!valid) return json({ ok: false, error: "invalid signature" }, 400);

  try {
    const orderNumber = event.data?.order?.order_id;
    const p = event.data?.payment;
    if (orderNumber && p?.cf_payment_id) {
      const order = await prisma.order.findFirst({ where: { gateway: "CASHFREE", orderNumber } });
      if (order) {
        const ref = { gateway: "CASHFREE" as const, paymentId: String(p.cf_payment_id), amount: Math.round((p.payment_amount ?? 0) * 100), currency: p.payment_currency || "INR", raw: p, via: "WEBHOOK" as const };
        if (p.payment_status === "SUCCESS") {
          await markOrderPaid(order.id, { ...ref, gatewayOrderId: orderNumber, method: p.payment_group });
        } else if (p.payment_status === "FAILED") {
          await markOrderFailed(order.id, "FAILED", p.payment_message || "Payment failed", ref);
        } else if (p.payment_status === "USER_DROPPED" || p.payment_status === "CANCELLED") {
          await markOrderFailed(order.id, "CANCELLED", p.payment_message || "Payment cancelled by customer", ref);
        }
      }
    }
    await prisma.paymentWebhook.update({ where: { id: log.id }, data: { processed: true } });
    return json({ ok: true });
  } catch (e) {
    await prisma.paymentWebhook.update({ where: { id: log.id }, data: { error: String(e).slice(0, 2000) } });
    return json({ ok: false }, 500);
  }
}
