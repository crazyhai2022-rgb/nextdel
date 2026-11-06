import Link from "next/link";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { formatMoney } from "@/lib/money";
import { dayBuckets, istDayKey, resolveRange } from "@/lib/date-range";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { Badge, FilterTabs, PageHeader, Panel, Stat, Table, td, fmtDate } from "@/components/admin/ui";
import { BarChart, Donut, HBarList } from "@/components/admin/Charts";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string; denied?: string }> }) {
  await guardPage("dashboard");
  const sp = await searchParams;
  const { key, start, end } = resolveRange(sp.range, sp.from, sp.to);
  const inRange = { gte: start, lt: end };

  const [byStatus, paidOrders, products, customers, abandoned, recent, topItems] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: { createdAt: inRange }, _count: true }),
    prisma.order.findMany({ where: { status: "PAID", paidAt: inRange }, select: { paidAt: true, total: true } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { orders: { some: { status: "PAID" } } } }),
    prisma.abandonedCheckout.count({ where: { createdAt: inRange, stage: { notIn: ["PAID", "CART"] } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: { select: { productTitle: true } } } }),
    prisma.orderItem.groupBy({ by: ["productTitle"], where: { order: { status: "PAID", paidAt: inRange } }, _sum: { unitPrice: true }, _count: true, orderBy: { _sum: { unitPrice: "desc" } }, take: 6 }),
  ]);

  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  const totalOrders = byStatus.reduce((s, b) => s + b._count, 0);
  const revenue = paidOrders.reduce((s, o) => s + o.total, 0);
  const paidCount = paidOrders.length;
  const attempted = count("PAID") + count("FAILED") + count("CANCELLED") + count("EXPIRED");
  const successRate = attempted ? (count("PAID") / attempted) * 100 : 0;

  const buckets = dayBuckets(start, end);
  const rev = new Map(buckets.map((k) => [k, 0]));
  const ord = new Map(buckets.map((k) => [k, 0]));
  for (const o of paidOrders) {
    const k = istDayKey(o.paidAt!);
    rev.set(k, (rev.get(k) ?? 0) + o.total);
    ord.set(k, (ord.get(k) ?? 0) + 1);
  }
  const label = (k: string) => new Date(`${k}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  const revenueData = buckets.map((k) => ({ label: label(k), value: rev.get(k) ?? 0 }));
  const ordersData = buckets.map((k) => ({ label: label(k), value: ord.get(k) ?? 0 }));

  const tabs = [
    { key: "today", label: "Today" },
    { key: "7d", label: "Last 7 days" },
    { key: "30d", label: "Last 30 days" },
    { key: "month", label: "This month" },
  ].map((t) => ({ ...t, href: `/admin?range=${t.key}` }));

  return (
    <div>
      {sp.denied && <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-200">You don&apos;t have access to that section.</p>}
      <PageHeader title="Dashboard" description={`${fmtDate(start, false)} – ${fmtDate(new Date(end.getTime() - 1), false)}`} />
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <FilterTabs tabs={tabs} active={key} />
        <form action="/admin" className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <input type="hidden" name="range" value="custom" />
          <input type="date" name="from" defaultValue={sp.from} className="input h-9 w-auto" aria-label="From" />
          <span className="text-ink-muted">to</span>
          <input type="date" name="to" defaultValue={sp.to} className="input h-9 w-auto" aria-label="To" />
          <button className={`btn-sm ${key === "custom" ? "btn-primary" : "btn-outline"}`}>Apply</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label="Total revenue" value={formatMoney(revenue)} hint={`${paidCount} paid order${paidCount === 1 ? "" : "s"}`} />
        <Stat label="Total orders" value={totalOrders} />
        <Stat label="Successful" value={count("PAID")} />
        <Stat label="Pending" value={count("PENDING") + count("PAYMENT_INITIATED")} />
        <Stat label="Failed payments" value={count("FAILED")} />
        <Stat label="Cancelled / expired" value={count("CANCELLED") + count("EXPIRED")} />
        <Stat label="Abandoned checkouts" value={abandoned} />
        <Stat label="Total products" value={products} />
        <Stat label="Paying customers" value={customers} hint="all time" />
        <Stat label="Refunded" value={count("REFUNDED")} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Panel title="Revenue"><BarChart data={revenueData} format={(v) => formatMoney(v)} /></Panel>
        <Panel title="Paid orders"><BarChart data={ordersData} color="#e8a9a2" /></Panel>
        <Panel title="Product performance"><HBarList rows={topItems.map((t) => ({ label: t.productTitle, value: t._sum.unitPrice ?? 0, sub: `${t._count} sold` }))} format={(v) => formatMoney(v)} /></Panel>
        <Panel title="Payment success rate">
          <Donut value={successRate} label={`${count("PAID")} of ${attempted} completed attempts`} />
          <p className="mt-3 text-xs text-ink-muted">Successful ÷ (successful + failed + cancelled + expired) for orders created in this period.</p>
        </Panel>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-ink">Recent orders</h2><Link href="/admin/orders" className="text-sm text-rose">View all →</Link></div>
        <Table head={["Order", "Customer", "Products", "Amount", "Status", "Date"]} empty="No orders yet.">
          {recent.map((o) => (
            <tr key={o.id} className="hover:bg-white/[0.02]">
              <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:underline">{o.orderNumber}</Link></td>
              <td className={td}><div className="text-ink">{o.customerName}</div><div className="text-xs text-ink-muted">{o.customerEmail}</div></td>
              <td className={`${td} max-w-[220px] truncate`}>{o.items.map((i) => i.productTitle).join(", ")}</td>
              <td className={td}>{formatMoney(o.total)}</td>
              <td className={td}><Badge status={o.status} label={ORDER_STATUS_LABEL[o.status]} /></td>
              <td className={`${td} whitespace-nowrap`}>{fmtDate(o.createdAt)}</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
