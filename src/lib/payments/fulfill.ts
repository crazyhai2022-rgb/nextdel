import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { deliveryEmail, failedEmail, pendingEmail, sendEmail } from "../email";
import { getSetting } from "../settings";
import { sendPurchaseEvent } from "../meta";
import { getGatewayConfig, type GatewayName } from "./gateway";
import { fetchOrderPayments, capturePayment } from "./razorpay";
import { getCashfreeOrder, getCashfreePayments } from "./cashfree";

type PaidInput = {
  gateway: GatewayName;
  paymentId: string;
  gatewayOrderId?: string | null;
  amount: number; // paise, as reported by the gateway
  currency: string;
  method?: string | null;
  raw?: unknown;
  via: "WEBHOOK" | "CALLBACK" | "POLL" | "RECONCILE";
};

const OPEN_STATUSES = ["PENDING", "PAYMENT_INITIATED", "FAILED", "EXPIRED", "CANCELLED"] as const;

/**
 * Idempotently marks an order as paid after the gateway has confirmed payment server-side.
 * Safe to call multiple times (webhook + callback + polling) — fulfilment runs once.
 */
export async function markOrderPaid(orderId: string, p: PaidInput): Promise<{ fulfilled: boolean; reason?: string }> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { fulfilled: false, reason: "Order not found" };

  await prisma.payment.upsert({
    where: { gateway_gatewayPaymentId: { gateway: p.gateway, gatewayPaymentId: p.paymentId } },
    create: {
      orderId,
      gateway: p.gateway,
      gatewayPaymentId: p.paymentId,
      gatewayOrderId: p.gatewayOrderId ?? order.gatewayOrderId,
      amount: p.amount,
      currency: p.currency,
      status: "SUCCESS",
      method: p.method ?? null,
      verifiedVia: p.via,
      raw: (p.raw ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    update: { status: "SUCCESS", method: p.method ?? undefined },
  });

  if (p.amount !== order.total || p.currency.toUpperCase() !== order.currency.toUpperCase()) {
    await prisma.order.update({
      where: { id: orderId },
      data: { failureReason: `Amount mismatch: gateway ${p.amount} ${p.currency}, expected ${order.total} ${order.currency}. Manual review required.` },
    });
    return { fulfilled: false, reason: "Amount mismatch" };
  }

  // Atomic transition guarantees single fulfilment even under concurrent webhook + callback.
  const res = await prisma.order.updateMany({
    where: { id: orderId, status: { in: [...OPEN_STATUSES] } },
    data: { status: "PAID", paidAt: new Date(), transactionId: p.paymentId, failureReason: null },
  });
  if (res.count === 0) return { fulfilled: false, reason: "Already processed" };

  await prisma.abandonedCheckout.updateMany({ where: { orderId }, data: { stage: "PAID", lastEvent: `paid_${p.via.toLowerCase()}`, lastActivityAt: new Date() } });

  await deliverOrder(orderId, "ORDER_CONFIRMATION");
  sendPurchaseEvent(orderId).catch((e) => console.error("[capi]", e));
  return { fulfilled: true };
}

/** Sends (or re-sends) the delivery email and updates delivery status. */
export async function deliverOrder(orderId: string, type: "ORDER_CONFIRMATION" | "RESEND_DELIVERY", sentById?: string | null) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.status !== "PAID") return { ok: false, error: "Order is not paid" };
  const mail = await deliveryEmail(order);
  const r = await sendEmail({
    to: order.customerEmail,
    subject: type === "RESEND_DELIVERY" ? `[Resent] ${mail.subject}` : mail.subject,
    html: mail.html,
    type,
    orderId,
    sentById,
  });
  await prisma.order.update({
    where: { id: orderId },
    data: r.ok ? { deliveryStatus: "DELIVERED", deliveredAt: order.deliveredAt ?? new Date() } : { deliveryStatus: order.deliveryStatus === "DELIVERED" ? "DELIVERED" : "EMAIL_FAILED" },
  });
  return r;
}

/** Marks failure/cancellation ONLY when the gateway reported it. */
export async function markOrderFailed(orderId: string, status: "FAILED" | "CANCELLED", reason: string, paymentRef?: { gateway: GatewayName; paymentId: string; amount: number; currency: string; raw?: unknown; via: PaidInput["via"] }) {
  if (paymentRef) {
    await prisma.payment.upsert({
      where: { gateway_gatewayPaymentId: { gateway: paymentRef.gateway, gatewayPaymentId: paymentRef.paymentId } },
      create: {
        orderId,
        gateway: paymentRef.gateway,
        gatewayPaymentId: paymentRef.paymentId,
        amount: paymentRef.amount,
        currency: paymentRef.currency,
        status,
        verifiedVia: paymentRef.via,
        raw: (paymentRef.raw ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      update: {},
    });
  }
  const res = await prisma.order.updateMany({
    where: { id: orderId, status: { in: ["PENDING", "PAYMENT_INITIATED"] } },
    data: { status, failureReason: reason.slice(0, 500), ...(status === "CANCELLED" ? { cancelledAt: new Date() } : {}) },
  });
  if (res.count === 0) return;
  await prisma.abandonedCheckout.updateMany({ where: { orderId }, data: { stage: status, lastEvent: reason.slice(0, 60), lastActivityAt: new Date() } });
  // Failure emails are sent later by reconcile (customers often retry successfully within minutes).
}

/** Emails customers whose orders are still FAILED 20+ minutes later (once per order). */
export async function notifyFailedOrders(limit = 30) {
  const email = await getSetting("email");
  if (!email.sendFailedEmail) return 0;
  const orders = await prisma.order.findMany({
    where: {
      status: "FAILED",
      updatedAt: { lt: new Date(Date.now() - 20 * 60_000), gt: new Date(Date.now() - 3 * 86400_000) },
      emailLogs: { none: { type: "PAYMENT_FAILED" } },
    },
    include: { items: true },
    take: limit,
  });
  for (const order of orders) {
    const mail = await failedEmail(order);
    await sendEmail({ to: order.customerEmail, subject: mail.subject, html: mail.html, type: "PAYMENT_FAILED", orderId: order.id });
  }
  return orders.length;
}

export async function sendPendingNotice(orderId: string) {
  const email = await getSetting("email");
  if (!email.sendPendingEmail) return;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === "PAID") return;
  const already = await prisma.emailLog.count({ where: { orderId, type: "PAYMENT_PENDING" } });
  if (already) return;
  const mail = await pendingEmail(order);
  await sendEmail({ to: order.customerEmail, subject: mail.subject, html: mail.html, type: "PAYMENT_PENDING", orderId });
}

/**
 * Asks the gateway for the authoritative order/payment status and applies it.
 * Used by the processing page poller, admin "check status" and the reconcile cron.
 */
export async function syncOrderWithGateway(orderId: string, via: "POLL" | "RECONCILE" = "POLL") {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || !order.gateway || !order.gatewayOrderId) return order?.status ?? null;
  if (order.status === "PAID" || order.status === "REFUNDED") return order.status;
  const cfg = await getGatewayConfig(order.gateway as GatewayName, (order.gatewayMode as "TEST" | "LIVE") ?? undefined);
  if (!cfg.configured) return order.status;

  try {
    if (order.gateway === "RAZORPAY") {
      const payments = await fetchOrderPayments(cfg, order.gatewayOrderId, order.id);
      let captured = payments.find((p) => p.status === "captured");
      const authorized = payments.find((p) => p.status === "authorized");
      if (!captured && authorized) {
        captured = await capturePayment(cfg, authorized.id, authorized.amount, authorized.currency, order.id).catch(() => undefined);
      }
      if (captured && captured.status === "captured") {
        await markOrderPaid(order.id, { gateway: "RAZORPAY", paymentId: captured.id, gatewayOrderId: captured.order_id, amount: captured.amount, currency: captured.currency, method: captured.method, raw: captured, via });
      } else if (payments.length > 0 && payments.every((p) => p.status === "failed")) {
        const last = payments[0];
        await markOrderFailed(order.id, "FAILED", last.error_description || "Payment failed at gateway", { gateway: "RAZORPAY", paymentId: last.id, amount: last.amount, currency: last.currency, raw: last, via });
      }
    } else if (order.gateway === "CASHFREE") {
      const cfOrder = await getCashfreeOrder(cfg, order.gatewayOrderId, order.id);
      if (cfOrder.order_status === "PAID") {
        const payments = await getCashfreePayments(cfg, order.gatewayOrderId, order.id);
        const ok = payments.find((p) => p.payment_status === "SUCCESS");
        if (ok) {
          await markOrderPaid(order.id, { gateway: "CASHFREE", paymentId: String(ok.cf_payment_id), gatewayOrderId: ok.order_id, amount: Math.round(ok.payment_amount * 100), currency: ok.payment_currency, method: ok.payment_group, raw: ok, via });
        }
      } else if (cfOrder.order_status === "TERMINATED") {
        await markOrderFailed(order.id, "CANCELLED", "Order terminated at gateway");
      } else if (cfOrder.order_status === "EXPIRED") {
        await prisma.order.updateMany({ where: { id: order.id, status: { in: ["PENDING", "PAYMENT_INITIATED"] } }, data: { status: "EXPIRED", failureReason: "Payment session expired at gateway" } });
        await prisma.abandonedCheckout.updateMany({ where: { orderId: order.id }, data: { stage: "EXPIRED" } });
      } else {
        const payments = await getCashfreePayments(cfg, order.gatewayOrderId, order.id);
        const latest = payments[0];
        if (latest && (latest.payment_status === "FAILED" || latest.payment_status === "USER_DROPPED" || latest.payment_status === "CANCELLED")) {
          const st = latest.payment_status === "FAILED" ? "FAILED" : "CANCELLED";
          await markOrderFailed(order.id, st, latest.payment_message || `Payment ${latest.payment_status.toLowerCase()}`, { gateway: "CASHFREE", paymentId: String(latest.cf_payment_id), amount: Math.round(latest.payment_amount * 100), currency: latest.payment_currency, raw: latest, via });
        }
      }
    }
  } catch (e) {
    console.error("[sync] gateway check failed", e);
  }
  return (await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } }))?.status ?? null;
}

/** Checks stale unpaid orders with the gateway, then expires those still unpaid. */
export async function reconcilePendingOrders(limit = 50) {
  const checkout = await getSetting("checkout");
  const hours = Math.max(1, Number(checkout.pendingExpiryHours) || 24);
  const stale = await prisma.order.findMany({
    where: { status: { in: ["PENDING", "PAYMENT_INITIATED"] }, createdAt: { lt: new Date(Date.now() - 15 * 60_000) } },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  let paid = 0;
  let expired = 0;
  for (const o of stale) {
    const st = await syncOrderWithGateway(o.id, "RECONCILE");
    if (st === "PAID") paid++;
    else if ((st === "PENDING" || st === "PAYMENT_INITIATED") && o.createdAt < new Date(Date.now() - hours * 3600_000)) {
      await prisma.order.update({ where: { id: o.id }, data: { status: "EXPIRED", failureReason: `No verified payment within ${hours}h` } });
      await prisma.abandonedCheckout.updateMany({ where: { orderId: o.id }, data: { stage: "EXPIRED" } });
      expired++;
    }
  }
  const failedNotified = await notifyFailedOrders();
  return { checked: stale.length, paid, expired, failedNotified };
}
