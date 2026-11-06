import Link from "next/link";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { formatMoney } from "@/lib/money";
import { DELIVERY_STATUS_LABEL, ORDER_STATUS_LABEL } from "@/lib/orders";
import { ORDER_TABS, orderSort, orderWhere } from "@/lib/order-filters";
import { Badge, FilterTabs, PageHeader, Pagination, Table, td, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Orders" };
const PER = 25;

type SP = { status?: string; q?: string; from?: string; to?: string; sort?: string; gateway?: string; page?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  await guardPage("orders");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = orderWhere(sp);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: orderSort(sp.sort), skip: (page - 1) * PER, take: PER, include: { items: { select: { productTitle: true } } } }),
    prisma.order.count({ where }),
  ]);
  const qs = (over: Partial<SP>) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...over }).filter(([, v]) => v) as [string, string][]);
    return `/admin/orders?${p.toString()}`;
  };
  const exportQs = new URLSearchParams(Object.entries({ status: sp.status, q: sp.q, from: sp.from, to: sp.to, gateway: sp.gateway }).filter(([, v]) => v) as [string, string][]);

  return (
    <div>
      <PageHeader title="Orders" description={`${total} order${total === 1 ? "" : "s"}`} actions={<a href={`/api/admin/orders/export?${exportQs}`} className="btn-outline btn-sm">Export CSV</a>} />
      <FilterTabs active={sp.status ?? "all"} tabs={ORDER_TABS.map((t) => ({ key: t.key, label: t.label, href: qs({ status: t.key === "all" ? undefined : t.key, page: undefined }) }))} />
      <form action="/admin/orders" className="mb-4 flex flex-wrap items-center gap-2">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input name="q" defaultValue={sp.q} placeholder="Order ID, email, name, transaction ID, product" className="input h-9 min-w-[240px] flex-1 sm:max-w-sm" />
        <input type="date" name="from" defaultValue={sp.from} className="input h-9 w-auto" aria-label="From date" />
        <input type="date" name="to" defaultValue={sp.to} className="input h-9 w-auto" aria-label="To date" />
        <select name="gateway" defaultValue={sp.gateway ?? ""} className="input h-9 w-auto">
          <option value="">All gateways</option><option value="RAZORPAY">Razorpay</option><option value="CASHFREE">Cashfree</option>
        </select>
        <select name="sort" defaultValue={sp.sort ?? ""} className="input h-9 w-auto">
          <option value="">Newest first</option><option value="oldest">Oldest first</option><option value="amount_desc">Amount: high → low</option><option value="amount_asc">Amount: low → high</option>
        </select>
        <button className="btn-outline btn-sm">Apply</button>
        {(sp.q || sp.from || sp.to || sp.gateway || sp.sort) && <Link href={qs({ q: undefined, from: undefined, to: undefined, gateway: undefined, sort: undefined, page: undefined })} className="text-sm text-ink-muted hover:text-ink">Clear</Link>}
      </form>
      <Table head={["Order", "Customer", "Products", "Amount", "Gateway", "Payment", "Delivery", "Date"]} empty="No orders match these filters.">
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-white/[0.02]">
            <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:underline">{o.orderNumber}</Link></td>
            <td className={td}><div className="text-ink">{o.customerName}</div><div className="text-xs text-ink-muted">{o.customerEmail}</div></td>
            <td className={`${td} max-w-[200px] truncate`}>{o.items.map((i) => i.productTitle).join(", ")}</td>
            <td className={`${td} whitespace-nowrap`}>{formatMoney(o.total)}</td>
            <td className={td}>{o.gateway ? `${o.gateway[0]}${o.gateway.slice(1).toLowerCase()}` : "—"}{o.gatewayMode === "TEST" && <span className="ml-1 text-[10px] text-amber-300">TEST</span>}</td>
            <td className={td}><Badge status={o.status} label={ORDER_STATUS_LABEL[o.status]} /></td>
            <td className={td}><Badge status={o.deliveryStatus} label={DELIVERY_STATUS_LABEL[o.deliveryStatus]} /></td>
            <td className={`${td} whitespace-nowrap`}>{fmtDate(o.createdAt)}</td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pages={Math.ceil(total / PER)} makeHref={(p) => qs({ page: String(p) })} />
    </div>
  );
}
