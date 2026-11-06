import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { Badge, FilterTabs, PageHeader, Pagination, Panel, Table, td, fmtDate } from "@/components/admin/ui";
import { EmailComposer } from "@/components/admin/EmailComposer";

export const metadata = { title: "Emails" };
const PER = 30;

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await guardPage("emails");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim();
  const where: Prisma.EmailLogWhereInput = {
    ...(sp.status ? { status: sp.status } : {}),
    ...(q ? { OR: [{ recipient: { contains: q.toLowerCase() } }, { subject: { contains: q } }, { order: { orderNumber: { contains: q } } }] } : {}),
  };
  const [logs, total, customers] = await Promise.all([
    prisma.emailLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { order: { select: { id: true, orderNumber: true } }, sentBy: { select: { name: true } } } }),
    prisma.emailLog.count({ where }),
    q && q.includes("@") ? prisma.customer.findMany({ where: { email: { contains: q.toLowerCase() } }, take: 5 }) : Promise.resolve([]),
  ]);
  const qs = (over: Record<string, string | undefined>) => `/admin/emails?${new URLSearchParams(Object.entries({ ...sp, ...over }).filter(([, v]) => v) as [string, string][])}`;
  return (
    <div>
      <PageHeader title="Emails" description="Delivery logs and customer communication" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <FilterTabs active={sp.status ?? ""} tabs={[{ key: "", label: "All" }, { key: "ACCEPTED", label: "Accepted" }, { key: "FAILED", label: "Failed" }, { key: "QUEUED", label: "Queued" }].map((t) => ({ ...t, href: qs({ status: t.key || undefined, page: undefined }) }))} />
          <form action="/admin/emails" className="mb-4 flex gap-2">
            {sp.status && <input type="hidden" name="status" value={sp.status} />}
            <input name="q" defaultValue={q} placeholder="Search recipient email, subject, order ID" className="input h-9 sm:w-80" />
            <button className="btn-outline btn-sm">Search</button>
          </form>
          {customers.length > 0 && (
            <div className="mb-4 rounded-xl border border-line p-3 text-sm">
              <div className="mb-1 text-xs text-ink-muted">Matching customers</div>
              {customers.map((c) => <Link key={c.id} href={`/admin/customers/${c.id}`} className="mr-3 text-rose hover:underline">{c.name} ({c.email})</Link>)}
            </div>
          )}
          <Table head={["Recipient", "Subject", "Type", "Order", "Status", "Sent"]} empty="No emails logged.">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className={td}>{l.recipient}</td>
                <td className={`${td} max-w-[260px]`}><div className="truncate text-ink">{l.subject}</div>{l.error && <div className="truncate text-xs text-red-300" title={l.error}>{l.error}</div>}</td>
                <td className={`${td} whitespace-nowrap text-xs`}>{l.type.replace(/_/g, " ").toLowerCase()}{l.sentBy && <div className="text-ink-muted">by {l.sentBy.name}</div>}</td>
                <td className={td}>{l.order ? <Link href={`/admin/orders/${l.order.id}`} className="hover:underline">{l.order.orderNumber}</Link> : "—"}</td>
                <td className={td}><Badge tone={l.status === "ACCEPTED" ? "green" : l.status === "FAILED" ? "red" : "amber"} label={l.status === "ACCEPTED" ? "Accepted" : l.status.toLowerCase()} /></td>
                <td className={`${td} whitespace-nowrap`}>{fmtDate(l.createdAt)}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} pages={Math.ceil(total / PER)} makeHref={(p) => qs({ page: String(p) })} />
          <p className="mt-3 text-xs text-ink-muted">&quot;Accepted&quot; means the SMTP server accepted the message for delivery. It does not confirm the message reached the inbox.</p>
        </div>
        <Panel title="Compose email" className="h-fit"><EmailComposer lockTo={false} /></Panel>
      </div>
    </div>
  );
}
