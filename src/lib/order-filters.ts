import type { Prisma } from "@prisma/client";

export const ORDER_TABS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Successful" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "expired", label: "Expired" },
  { key: "refunded", label: "Refunded" },
  { key: "delivered", label: "Delivered" },
] as const;

export function orderWhere(sp: { status?: string; q?: string; from?: string; to?: string; gateway?: string }): Prisma.OrderWhereInput {
  const w: Prisma.OrderWhereInput = {};
  switch (sp.status) {
    case "paid": w.status = "PAID"; break;
    case "pending": w.status = { in: ["PENDING", "PAYMENT_INITIATED"] }; break;
    case "failed": w.status = "FAILED"; break;
    case "cancelled": w.status = "CANCELLED"; break;
    case "expired": w.status = "EXPIRED"; break;
    case "refunded": w.status = "REFUNDED"; break;
    case "delivered": w.deliveryStatus = "DELIVERED"; break;
  }
  if (sp.gateway === "RAZORPAY" || sp.gateway === "CASHFREE") w.gateway = sp.gateway;
  const q = sp.q?.trim();
  if (q) {
    w.OR = [
      { orderNumber: { contains: q } },
      { customerEmail: { contains: q.toLowerCase() } },
      { customerName: { contains: q } },
      { transactionId: { contains: q } },
      { gatewayOrderId: { contains: q } },
      { items: { some: { productTitle: { contains: q } } } },
    ];
  }
  const range: Prisma.DateTimeFilter = {};
  if (sp.from && /^\d{4}-\d{2}-\d{2}$/.test(sp.from)) range.gte = new Date(`${sp.from}T00:00:00+05:30`);
  if (sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.to)) range.lt = new Date(new Date(`${sp.to}T00:00:00+05:30`).getTime() + 86400_000);
  if (range.gte || range.lt) w.createdAt = range;
  return w;
}

export function orderSort(sort?: string): Prisma.OrderOrderByWithRelationInput {
  switch (sort) {
    case "oldest": return { createdAt: "asc" };
    case "amount_desc": return { total: "desc" };
    case "amount_asc": return { total: "asc" };
    default: return { createdAt: "desc" };
  }
}
