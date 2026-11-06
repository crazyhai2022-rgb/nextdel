import { z } from "zod";
import type { CheckoutStage } from "@prisma/client";
import { prisma } from "@/lib/db";
import { publicProductWhere } from "@/lib/products";
import { clientIp, handleError, json } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  visitorId: z.string().min(4).max(64).regex(/^[A-Za-z0-9-]+$/),
  stage: z.enum(["CART", "CHECKOUT_STARTED", "DETAILS_ENTERED", "PAYMENT_WINDOW_CLOSED"]),
  productIds: z.array(z.string().max(40)).max(50).optional(),
  name: z.string().max(120).optional(),
  email: z.string().email().max(191).optional(),
  token: z.string().max(64).optional(),
});

const RANK: Record<CheckoutStage, number> = {
  CART: 0, CHECKOUT_STARTED: 1, DETAILS_ENTERED: 2, ORDER_CREATED: 3, PAYMENT_INITIATED: 4, PAID: 9, FAILED: 5, CANCELLED: 5, EXPIRED: 5,
};

/** Records checkout funnel progress for the Abandoned Checkouts report. */
export async function POST(req: Request) {
  try {
    rateLimit(`track:${clientIp(req)}`, 60, 60_000);
    const body = schema.parse(await req.json());

    if (body.stage === "PAYMENT_WINDOW_CLOSED") {
      // Customer closed the payment window. Not a gateway-confirmed cancellation — only noted.
      if (body.token) {
        const order = await prisma.order.findUnique({ where: { accessToken: body.token }, select: { id: true } });
        if (order) await prisma.abandonedCheckout.updateMany({ where: { orderId: order.id }, data: { lastEvent: "payment_window_closed", lastActivityAt: new Date() } });
      }
      return json({ ok: true });
    }

    let snapshot: { id: string; title: string; price: number }[] | undefined;
    let amount: number | undefined;
    if (body.productIds?.length) {
      const products = await prisma.product.findMany({ where: { id: { in: body.productIds }, ...publicProductWhere }, select: { id: true, title: true, salePrice: true } });
      snapshot = products.map((p) => ({ id: p.id, title: p.title, price: p.salePrice }));
      amount = products.reduce((s, p) => s + p.salePrice, 0);
    }

    const existing = await prisma.abandonedCheckout.findFirst({
      where: { visitorId: body.visitorId, orderId: null, lastActivityAt: { gt: new Date(Date.now() - 7 * 86400_000) } },
      orderBy: { lastActivityAt: "desc" },
    });
    const stage = body.stage as CheckoutStage;
    const data = {
      ...(snapshot ? { cartSnapshot: snapshot, amount } : {}),
      ...(body.name ? { name: body.name.trim() } : {}),
      ...(body.email ? { email: body.email.trim().toLowerCase() } : {}),
      lastActivityAt: new Date(),
      lastEvent: stage.toLowerCase(),
    };
    if (existing) {
      if (snapshot && snapshot.length === 0) {
        await prisma.abandonedCheckout.delete({ where: { id: existing.id } });
        return json({ ok: true });
      }
      await prisma.abandonedCheckout.update({
        where: { id: existing.id },
        data: { ...data, stage: RANK[stage] > RANK[existing.stage] ? stage : existing.stage },
      });
    } else if (!snapshot || snapshot.length > 0) {
      await prisma.abandonedCheckout.create({ data: { visitorId: body.visitorId, stage, ...data } });
    }
    return json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
