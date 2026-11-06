import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { orderWhere } from "@/lib/order-filters";
import { audit } from "@/lib/audit";

function csvCell(v: unknown) {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula-injection guard
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req, "orders");
    const sp = Object.fromEntries(new URL(req.url).searchParams.entries());
    const orders = await prisma.order.findMany({ where: orderWhere(sp), orderBy: { createdAt: "desc" }, take: 50000, include: { items: true } });
    const header = ["Order ID", "Date (IST)", "Customer Name", "Customer Email", "Phone", "Products", "Product IDs", "Subtotal", "Discount", "Final Amount", "Currency", "Gateway", "Mode", "Gateway Order ID", "Transaction ID", "Payment Status", "Delivery Status", "Paid At (IST)"];
    const ist = (d: Date | null) => (d ? d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "");
    const rows = orders.map((o) => [
      o.orderNumber, ist(o.createdAt), o.customerName, o.customerEmail, o.customerPhone, o.items.map((i) => i.productTitle).join(" | "), o.items.map((i) => i.productId ?? "").join(" | "),
      (o.subtotal / 100).toFixed(2), (o.discount / 100).toFixed(2), (o.total / 100).toFixed(2), o.currency, o.gateway, o.gatewayMode, o.gatewayOrderId, o.transactionId, o.status, o.deliveryStatus, ist(o.paidAt),
    ]);
    const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    await audit(admin.id, "orders_exported", { entity: "order", details: { count: orders.length, filters: sp } });
    return new Response(csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    return handleError(e);
  }
}
