import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { json } from "@/lib/http";
import { getGatewayConfig } from "@/lib/payments/gateway";
import { verifyRazorpayWebhook, type RzpPayment } from "@/lib/payments/razorpay";
import { markOrderFailed, markOrderPaid } from "@/lib/payments/fulfill";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const eventId = req.headers.get("x-razorpay-event-id") || sha256(raw);

  const [test, live] = await Promise.all([getGatewayConfig("RAZORPAY", "TEST"), getGatewayConfig("RAZORPAY", "LIVE")]);
  const valid = verifyRazorpayWebhook(raw, signature, live.webhookSecret) || verifyRazorpayWebhook(raw, signature, test.webhookSecret);

  let event: { event?: string; payload?: { payment?: { entity?: RzpPayment } } } = {};
  try {
    event = JSON.parse(raw);
  } catch {}

  const dup = await prisma.paymentWebhook.findUnique({ where: { gateway_eventId: { gateway: "RAZORPAY", eventId } } });
  if (dup?.processed) return json({ ok: true, duplicate: true });

  const log = dup ?? (await prisma.paymentWebhook.create({
    data: { gateway: "RAZORPAY", eventId, eventType: event.event?.slice(0, 80), signatureValid: valid, payload: raw.slice(0, 200000) },
  }));
  if (!valid) return json({ ok: false, error: "invalid signature" }, 400);

  try {
    const p = event.payload?.payment?.entity;
    if (p?.order_id) {
      const order = await prisma.order.findFirst({ where: { gateway: "RAZORPAY", gatewayOrderId: p.order_id } });
      if (order) {
        await prisma.paymentWebhook.update({ where: { id: log.id }, data: { orderNumber: order.orderNumber } });
        if ((event.event === "payment.captured" || event.event === "order.paid") && p.status === "captured") {
          await markOrderPaid(order.id, { gateway: "RAZORPAY", paymentId: p.id, gatewayOrderId: p.order_id, amount: p.amount, currency: p.currency, method: p.method, raw: p, via: "WEBHOOK" });
        } else if (event.event === "payment.failed") {
          await markOrderFailed(order.id, "FAILED", p.error_description || "Payment failed", { gateway: "RAZORPAY", paymentId: p.id, amount: p.amount, currency: p.currency, raw: p, via: "WEBHOOK" });
        }
      }
    }
    await prisma.paymentWebhook.update({ where: { id: log.id }, data: { processed: true } });
    return json({ ok: true });
  } catch (e) {
    await prisma.paymentWebhook.update({ where: { id: log.id }, data: { error: String(e).slice(0, 2000) } });
    return json({ ok: false }, 500); // Razorpay retries non-2xx
  }
}
