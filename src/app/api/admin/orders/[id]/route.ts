import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { clientIp, handleError, json, jsonError } from "@/lib/http";
import { audit } from "@/lib/audit";
import { deliverOrder, syncOrderWithGateway } from "@/lib/payments/fulfill";

const schema = z.object({ action: z.enum(["resend", "sync", "refund", "cancel"]), note: z.string().max(500).optional() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req, "orders");
    const { id } = await params;
    const { action, note } = schema.parse(await req.json());
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return jsonError("Order not found", 404);
    const ip = clientIp(req);

    if (action === "resend") {
      if (order.status !== "PAID") return jsonError("Only successful (verified paid) orders can be re-delivered.", 409);
      const r = await deliverOrder(order.id, "RESEND_DELIVERY", admin.id);
      await audit(admin.id, "order_resend_email", { entity: "order", entityId: order.id, details: { ok: r.ok }, ip });
      return r.ok ? json({ ok: true, message: `Accepted by mail server for ${order.customerEmail}` }) : jsonError(`Email failed: ${r.error}`, 502);
    }
    if (action === "sync") {
      const before = order.status;
      const after = await syncOrderWithGateway(order.id, "RECONCILE");
      await audit(admin.id, "order_gateway_sync", { entity: "order", entityId: order.id, details: { before, after }, ip });
      return json({ ok: true, message: before === after ? `Gateway status unchanged (${after})` : `Updated: ${before} → ${after}` });
    }
    if (action === "refund") {
      // Records a refund processed in the gateway dashboard. Access is revoked (downloads require PAID).
      if (order.status !== "PAID") return jsonError("Only paid orders can be marked refunded.", 409);
      await prisma.order.update({ where: { id }, data: { status: "REFUNDED", refundedAt: new Date(), failureReason: note ? `Refund note: ${note}` : order.failureReason } });
      await audit(admin.id, "order_marked_refunded", { entity: "order", entityId: id, details: { note: note ?? null }, ip });
      return json({ ok: true, message: "Marked as refunded. Product access has been revoked." });
    }
    if (action === "cancel") {
      if (!["PENDING", "PAYMENT_INITIATED"].includes(order.status)) return jsonError("Only unpaid orders can be cancelled.", 409);
      // Safety: confirm with the gateway first so a paid order is never cancelled.
      const st = await syncOrderWithGateway(order.id, "RECONCILE");
      if (st === "PAID") return jsonError("The gateway reports this order as PAID — it was fulfilled instead of cancelled.", 409);
      await prisma.order.updateMany({ where: { id, status: { in: ["PENDING", "PAYMENT_INITIATED"] } }, data: { status: "CANCELLED", cancelledAt: new Date(), failureReason: `Cancelled by admin${note ? `: ${note}` : ""}` } });
      await prisma.abandonedCheckout.updateMany({ where: { orderId: id }, data: { stage: "CANCELLED", lastEvent: "cancelled_by_admin" } });
      await audit(admin.id, "order_cancelled", { entity: "order", entityId: id, ip });
      return json({ ok: true, message: "Order cancelled." });
    }
    return jsonError("Unknown action", 400);
  } catch (e) {
    return handleError(e);
  }
}
