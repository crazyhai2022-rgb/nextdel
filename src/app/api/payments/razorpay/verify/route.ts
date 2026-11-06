import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, handleError, json, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { getGatewayConfig } from "@/lib/payments/gateway";
import { capturePayment, fetchPayment, verifyCheckoutSignature } from "@/lib/payments/razorpay";
import { markOrderPaid } from "@/lib/payments/fulfill";

const schema = z.object({
  token: z.string().min(20).max(64),
  razorpay_order_id: z.string().max(100),
  razorpay_payment_id: z.string().max(100),
  razorpay_signature: z.string().max(200),
});

/** Called by the browser after Razorpay Checkout succeeds. Verifies signature AND re-fetches the payment server-side. */
export async function POST(req: Request) {
  try {
    rateLimit(`rzpverify:${clientIp(req)}`, 20, 60_000);
    const b = schema.parse(await req.json());
    const order = await prisma.order.findUnique({ where: { accessToken: b.token } });
    if (!order || order.gateway !== "RAZORPAY" || order.gatewayOrderId !== b.razorpay_order_id) return jsonError("Order not found", 404);
    if (order.status === "PAID") return json({ ok: true, status: "PAID" });

    const cfg = await getGatewayConfig("RAZORPAY", (order.gatewayMode as "TEST" | "LIVE") ?? undefined);
    if (!verifyCheckoutSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature, cfg.secret)) {
      return jsonError("Payment signature verification failed", 400);
    }
    let payment = await fetchPayment(cfg, b.razorpay_payment_id, order.id);
    if (payment.order_id !== order.gatewayOrderId) return jsonError("Payment does not belong to this order", 400);
    if (payment.status === "authorized") payment = await capturePayment(cfg, payment.id, payment.amount, payment.currency, order.id);
    if (payment.status !== "captured") return json({ ok: true, status: "PENDING" });

    const r = await markOrderPaid(order.id, {
      gateway: "RAZORPAY",
      paymentId: payment.id,
      gatewayOrderId: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      raw: payment,
      via: "CALLBACK",
    });
    const fresh = await prisma.order.findUnique({ where: { id: order.id }, select: { status: true } });
    return json({ ok: true, status: fresh?.status, note: r.reason });
  } catch (e) {
    return handleError(e);
  }
}
