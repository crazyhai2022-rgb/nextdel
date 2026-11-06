import Link from "next/link";
import type { Prisma, CheckoutStage } from "@prisma/client";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { formatMoney } from "@/lib/money";
import { STAGE_LABEL } from "@/lib/orders";
import { Badge, FilterTabs, PageHeader, Pagination, Table, td, fmtDate } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/client";
import { ContactDrawer } from "@/components/admin/ContactDrawer";

export const metadata = { title: "Abandoned Checkouts" };
const PER = 25;

const TABS: { key: string; label: string; stages: CheckoutStage[] }[] = [
  { key: "all", label: "All (excl. cart only)", stages: ["CHECKOUT_STARTED", "DETAILS_ENTERED", "ORDER_CREATED", "PAYMENT_INITIATED", "FAILED", "CANCELLED", "EXPIRED", "PAID"] },
  { key: "started", label: "Checkout started", stages: ["CHECKOUT_STARTED", "DETAILS_ENTERED"] },
  { key: "initiated", label: "Payment initiated", stages: ["PAYMENT_INITIATED"] },
  { key: "pending", label: "Pending", stages: ["ORDER_CREATED"] },
  { key: "failed", label: "Failed", stages: ["FAILED"] },
  { key: "cancelled", label: "Cancelled", stages: ["CANCELLED"] },
  { key: "expired", label: "Expired", stages: ["EXPIRED"] },
  { key: "paid", label: "Successfully paid", stages: ["PAID"] },
  { key: "cart", label: "Cart only", stages: ["CART"] },
];

type SP = { tab?: string; q?: string; page?: string; withEmail?: string };

export default async function AbandonedPage({ searchParams }: { searchParams: Promise<SP> }) {
  await guardPage("abandoned");
  const sp = await searchParams;
  const tab = TABS.find((t) => t.key === sp.tab) ?? TABS[0];
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim();
  const where: Prisma.AbandonedCheckoutWhereInput = {
    stage: { in: tab.stages },
    ...(sp.withEmail ? { email: { not: null } } : {}),
    ...(q ? { OR: [{ email: { contains: q.toLowerCase() } }, { name: { contains: q } }, { order: { orderNumber: { contains: q } } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.abandonedCheckout.findMany({ where, orderBy: { lastActivityAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { order: { select: { id: true, orderNumber: true, total: true, status: true, gateway: true } } } }),
    prisma.abandonedCheckout.count({ where }),
  ]);
  const qs = (over: Partial<SP>) => `/admin/abandoned?${new URLSearchParams(Object.entries({ ...sp, ...over }).filter(([, v]) => v) as [string, string][])}`;

  return (
    <div>
      <PageHeader
        title="Abandoned Checkouts"
        description="Visitors who started checkout or payment but didn't complete it. Statuses change only on gateway-confirmed events or verified expiry."
        actions={<ActionButton url="/api/admin/reconcile" label="Reconcile with gateway now" />}
      />
      <FilterTabs active={tab.key} tabs={TABS.map((t) => ({ key: t.key, label: t.label, href: qs({ tab: t.key, page: undefined }) }))} />
      <form action="/admin/abandoned" className="mb-4 flex flex-wrap items-center gap-2">
        <input type="hidden" name="tab" value={tab.key} />
        <input name="q" defaultValue={q} placeholder="Email, name or order ID" className="input h-9 sm:w-72" />
        <label className="flex items-center gap-2 text-sm text-ink-soft"><input type="checkbox" name="withEmail" value="1" defaultChecked={!!sp.withEmail} className="accent-[#6B1E23]" /> Has email</label>
        <button className="btn-outline btn-sm">Filter</button>
      </form>
      <Table head={["Customer", "Products", "Amount", "Order", "Gateway", "Last stage", "Last activity", ""]} empty="No abandoned checkouts in this view.">
        {rows.map((r) => {
          const items = (r.cartSnapshot as { title: string }[] | null) ?? [];
          return (
            <tr key={r.id} className="hover:bg-white/[0.02]">
              <td className={td}><div className="text-ink">{r.name ?? <span className="text-ink-muted">Unknown</span>}</div><div className="text-xs text-ink-muted">{r.email ?? "no email"}</div></td>
              <td className={`${td} max-w-[220px] truncate`}>{items.map((i) => i.title).join(", ") || "—"}</td>
              <td className={td}>{formatMoney(r.order?.total ?? r.amount)}</td>
              <td className={td}>{r.order ? <Link href={`/admin/orders/${r.order.id}`} className="text-ink hover:underline">{r.order.orderNumber}</Link> : "—"}</td>
              <td className={td}>{r.gateway ?? "—"}</td>
              <td className={td}><Badge status={r.stage} label={STAGE_LABEL[r.stage]} />{r.lastEvent === "payment_window_closed" && <div className="mt-1 text-[11px] text-ink-muted">closed payment window</div>}</td>
              <td className={`${td} whitespace-nowrap`}>{fmtDate(r.lastActivityAt)}{r.contactedAt && <div className="text-[11px] text-emerald-300">contacted {fmtDate(r.contactedAt, false)}</div>}</td>
              <td className={td}>{r.email && r.stage !== "PAID" && <ContactDrawer checkoutId={r.id} email={r.email} name={r.name} products={items.map((i) => i.title)} />}</td>
            </tr>
          );
        })}
      </Table>
      <Pagination page={page} pages={Math.ceil(total / PER)} makeHref={(p) => qs({ page: String(p) })} />
      <p className="mt-4 text-xs text-ink-muted">Only contact customers who voluntarily provided their email and where such communication is legally permitted.</p>
    </div>
  );
}
