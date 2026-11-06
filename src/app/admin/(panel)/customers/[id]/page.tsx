import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { formatMoney } from "@/lib/money";
import { DELIVERY_STATUS_LABEL, ORDER_STATUS_LABEL } from "@/lib/orders";
import { Badge, PageHeader, Panel, Table, td, fmtDate } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/client";
import { EmailComposer } from "@/components/admin/EmailComposer";

export const metadata = { title: "Customer" };

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await guardPage("customers");
  const { id } = await params;
  const c = await prisma.customer.findUnique({ where: { id }, include: { orders: { orderBy: { createdAt: "desc" }, include: { items: { select: { productTitle: true } } } } } });
  if (!c) notFound();
  const emails = await prisma.emailLog.findMany({ where: { recipient: c.email }, orderBy: { createdAt: "desc" }, take: 30 });
  const paid = c.orders.filter((o) => o.status === "PAID");
  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-ink-muted hover:text-ink">← Customers</Link>
      <PageHeader title={c.name} description={`${c.email}${c.phone ? ` · ${c.phone}` : ""} · customer since ${fmtDate(c.createdAt, false)}`} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-line bg-surface/60 p-4"><div className="text-xs text-ink-muted">Orders</div><div className="text-xl font-semibold text-ink">{c.orders.length}</div></div>
            <div className="rounded-xl border border-line bg-surface/60 p-4"><div className="text-xs text-ink-muted">Paid</div><div className="text-xl font-semibold text-ink">{paid.length}</div></div>
            <div className="rounded-xl border border-line bg-surface/60 p-4"><div className="text-xs text-ink-muted">Spent</div><div className="text-xl font-semibold text-ink">{formatMoney(paid.reduce((s, o) => s + o.total, 0))}</div></div>
          </div>
          <Table head={["Order", "Products", "Amount", "Payment", "Delivery", "Date", ""]} empty="No orders.">
            {c.orders.map((o) => (
              <tr key={o.id}>
                <td className={td}><Link href={`/admin/orders/${o.id}`} className="text-ink hover:underline">{o.orderNumber}</Link></td>
                <td className={`${td} max-w-[180px] truncate`}>{o.items.map((i) => i.productTitle).join(", ")}</td>
                <td className={td}>{formatMoney(o.total)}</td>
                <td className={td}><Badge status={o.status} label={ORDER_STATUS_LABEL[o.status]} /></td>
                <td className={td}><Badge status={o.deliveryStatus} label={DELIVERY_STATUS_LABEL[o.deliveryStatus]} /></td>
                <td className={`${td} whitespace-nowrap`}>{fmtDate(o.createdAt)}</td>
                <td className={td}>{o.status === "PAID" && <ActionButton url={`/api/admin/orders/${o.id}`} body={{ action: "resend" }} label="Resend" confirm={`Resend delivery email for ${o.orderNumber}?`} />}</td>
              </tr>
            ))}
          </Table>
          <Panel title="Emails sent to this customer">
            {emails.length ? (
              <ul className="divide-y divide-line text-sm">
                {emails.map((e) => (
                  <li key={e.id} className="flex justify-between gap-3 py-2">
                    <span className="min-w-0"><span className="block truncate text-ink">{e.subject}</span><span className="text-xs text-ink-muted">{e.type.replace(/_/g, " ").toLowerCase()} · {fmtDate(e.createdAt)}</span></span>
                    <Badge tone={e.status === "ACCEPTED" ? "green" : e.status === "FAILED" ? "red" : "amber"} label={e.status === "ACCEPTED" ? "Accepted" : e.status.toLowerCase()} />
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-muted">No emails yet.</p>}
          </Panel>
        </div>
        <Panel title="Send custom email" className="h-fit"><EmailComposer to={c.email} defaultSubject="" /></Panel>
      </div>
    </div>
  );
}
