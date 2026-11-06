import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, handleError, json } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { deliverOrder } from "@/lib/payments/fulfill";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(191), orderNumber: z.string().trim().toUpperCase().max(32).optional() });

const GENERIC = "If we found a successful order for this email, your access link has been sent. Please check your inbox and spam folder in a few minutes.";

/** Never reveals whether an email has orders (prevents enumeration); resends delivery to the address on file only. */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    rateLimit(`lookup:${ip}`, 5, 15 * 60_000);
    const b = schema.parse(await req.json());
    rateLimit(`lookup-email:${b.email}`, 3, 60 * 60_000);
    const orders = await prisma.order.findMany({
      where: { customerEmail: b.email, status: "PAID", ...(b.orderNumber ? { orderNumber: b.orderNumber } : {}) },
      orderBy: { paidAt: "desc" },
      take: 5,
      select: { id: true },
    });
    for (const o of orders) await deliverOrder(o.id, "RESEND_DELIVERY");
    return json({ ok: true, message: GENERIC });
  } catch (e) {
    return handleError(e);
  }
}
