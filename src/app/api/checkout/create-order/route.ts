import { z } from "zod";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { publicProductWhere } from "@/lib/products";
import { clientIp, handleError, json, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { randomToken } from "@/lib/crypto";
import { generateOrderNumber } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/env";
import { getActiveGateway, type GatewayConfig } from "@/lib/payments/gateway";
import { createRazorpayOrder } from "@/lib/payments/razorpay";
import { createCashfreeOrder } from "@/lib/payments/cashfree";

const schema = z.object({
  productIds: z.array(z.string().min(1).max(40)).min(1).max(20),
  name: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(191),
  phone: z.string().trim().max(20).optional(),
  visitorId: z.string().max(64).regex(/^[A-Za-z0-9-]*$/).optional(),
  idempotencyKey: z.string().min(16).max(64).regex(/^[A-Za-z0-9_-]+$/),
  ageConfirmed: z.boolean().optional(),
});

type OrderRow = Prisma.OrderGetPayload<{ include: { items: true } }>;

function paymentPayload(order: OrderRow, cfg: GatewayConfig, siteName: string) {
  const base = { ok: true, token: order.accessToken, orderNumber: order.orderNumber, gateway: cfg.gateway, amount: order.total, currency: order.currency };
  if (cfg.gateway === "RAZORPAY") {
    return {
      ...base,
      razorpay: {
        keyId: cfg.publicKey,
        orderId: order.gatewayOrderId,
        name: siteName,
        description: order.items.map((i) => i.productTitle).join(", ").slice(0, 250),
        prefill: { name: order.customerName, email: order.customerEmail, ...(order.customerPhone ? { contact: order.customerPhone } : {}) },
      },
    };
  }
  const data = (order.gatewayData ?? {}) as { paymentSessionId?: string };
  return { ...base, cashfree: { paymentSessionId: data.paymentSessionId, mode: cfg.mode === "LIVE" ? "production" : "sandbox" } };
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    rateLimit(`order:${ip}`, 12, 60_000);
    const body = schema.parse(await req.json());
    const { general, checkout } = await getSettings("general", "checkout");

    const cfg = await getActiveGateway();
    if (!cfg) return jsonError("Online payments are temporarily unavailable. Please try again later or contact support.", 503);
    if (checkout.requireAgeConfirmation && !body.ageConfirmed) return jsonError("Please confirm the age requirement to continue.", 422);

    let phone: string | null = null;
    if (body.phone) {
      const digits = body.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
      if (!/^[6-9]\d{9}$/.test(digits)) return jsonError("Please enter a valid 10-digit mobile number.", 422);
      phone = digits;
    }
    // The checkout does not ask for a mobile number. Cashfree's API requires one, so when the customer
    // gave none we send a placeholder to the gateway only (it is never stored on the customer record).
    const gatewayPhone = phone ?? (/^[6-9]\d{9}$/.test(process.env.CASHFREE_DEFAULT_PHONE ?? "") ? process.env.CASHFREE_DEFAULT_PHONE! : "9999999999");

    // Idempotent retry: same submission returns the same order.
    const existing = await prisma.order.findUnique({ where: { idempotencyKey: body.idempotencyKey }, include: { items: true } });
    if (existing) {
      if (existing.status === "PAID") return json({ ok: true, alreadyPaid: true, token: existing.accessToken });
      if (existing.gateway === cfg.gateway && existing.gatewayOrderId && existing.status === "PAYMENT_INITIATED") {
        return json(paymentPayload(existing, cfg, general.siteName));
      }
      return jsonError("This checkout session has expired. Please refresh the page and try again.", 409);
    }

    const ids = [...new Set(body.productIds)];
    const products = await prisma.product.findMany({ where: { id: { in: ids }, ...publicProductWhere } });
    if (products.length !== ids.length) {
      return jsonError("Some items in your cart are no longer available. Please review your cart.", 409, { code: "CART_CHANGED" });
    }
    // Prices come from the database, never from the browser.
    const subtotal = products.reduce((s, p) => s + Math.max(p.originalPrice, p.salePrice), 0);
    const total = products.reduce((s, p) => s + p.salePrice, 0);
    if (total < 100) return jsonError("Order total must be at least ₹1.", 422);

    const customer = await prisma.customer.upsert({
      where: { email: body.email },
      create: { email: body.email, name: body.name, phone },
      update: { name: body.name, ...(phone ? { phone } : {}) },
    });

    const jar = await cookies();
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        accessToken: randomToken(32),
        idempotencyKey: body.idempotencyKey,
        customerId: customer.id,
        customerName: body.name,
        customerEmail: body.email,
        customerPhone: phone,
        subtotal,
        discount: subtotal - total,
        total,
        currency: general.currency || "INR",
        gateway: cfg.gateway,
        gatewayMode: cfg.mode,
        status: "PENDING",
        fbp: jar.get("_fbp")?.value?.slice(0, 255) ?? null,
        fbc: jar.get("_fbc")?.value?.slice(0, 255) ?? null,
        clientIp: ip,
        userAgent: req.headers.get("user-agent")?.slice(0, 255) ?? null,
        sourceUrl: req.headers.get("referer")?.slice(0, 500) ?? null,
        items: {
          create: products.map((p) => ({
            productId: p.id,
            productTitle: p.title,
            productSlug: p.slug,
            thumbnailUrl: p.thumbnailUrl,
            unitOriginalPrice: p.originalPrice,
            unitPrice: p.salePrice,
          })),
        },
      },
      include: { items: true },
    });

    // Attach to the visitor's funnel record (abandoned checkout tracking).
    const funnel = body.visitorId
      ? await prisma.abandonedCheckout.findFirst({ where: { visitorId: body.visitorId, orderId: null }, orderBy: { lastActivityAt: "desc" } })
      : null;
    const funnelData = {
      name: body.name,
      email: body.email,
      customerId: customer.id,
      orderId: order.id,
      amount: total,
      gateway: cfg.gateway,
      stage: "ORDER_CREATED" as const,
      cartSnapshot: products.map((p) => ({ id: p.id, title: p.title, price: p.salePrice })),
      lastEvent: "order_created",
      lastActivityAt: new Date(),
    };
    if (funnel) await prisma.abandonedCheckout.update({ where: { id: funnel.id }, data: funnelData });
    else await prisma.abandonedCheckout.create({ data: { visitorId: body.visitorId || "unknown", ...funnelData } });

    try {
      let gatewayOrderId: string;
      let gatewayData: Prisma.InputJsonValue | undefined;
      if (cfg.gateway === "RAZORPAY") {
        const rzp = await createRazorpayOrder(cfg, { amount: total, currency: order.currency, receipt: order.orderNumber, notes: { order_number: order.orderNumber, email: body.email } }, order.id);
        if (rzp.amount !== total) throw new Error("Gateway amount mismatch");
        gatewayOrderId = rzp.id;
      } else {
        const cf = await createCashfreeOrder(
          cfg,
          {
            orderNumber: order.orderNumber,
            amount: total,
            currency: order.currency,
            customer: { id: customer.id, name: body.name, email: body.email, phone: gatewayPhone },
            returnUrl: `${siteUrl()}/payment/processing?token=${order.accessToken}`,
            notifyUrl: `${siteUrl()}/api/webhooks/cashfree`,
            note: order.items.map((i) => i.productTitle).join(", "),
          },
          order.id,
        );
        gatewayOrderId = cf.order_id;
        gatewayData = { paymentSessionId: cf.payment_session_id, cfOrderId: String(cf.cf_order_id) };
      }
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: { gatewayOrderId, gatewayData, status: "PAYMENT_INITIATED" },
        include: { items: true },
      });
      await prisma.abandonedCheckout.updateMany({ where: { orderId: order.id }, data: { stage: "PAYMENT_INITIATED", lastEvent: "payment_initiated" } });
      return json(paymentPayload(updated, cfg, general.siteName));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gateway error";
      await prisma.order.update({ where: { id: order.id }, data: { failureReason: `Could not start payment: ${msg}`.slice(0, 500) } });
      console.error("[create-order] gateway error", msg);
      return jsonError("We couldn't start the payment. Please try again in a moment.", 502);
    }
  } catch (e) {
    return handleError(e);
  }
}
