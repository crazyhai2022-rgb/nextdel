import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { Badge, FilterTabs, PageHeader, Pagination, Table, td, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Inquiries" };
const PER = 30;
const TONE: Record<string, string> = { NEW: "amber", IN_PROGRESS: "slate", RESOLVED: "green" };

export default async function InquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await guardPage("inquiries");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim();
  const where: Prisma.ContactInquiryWhereInput = {
    ...(sp.status ? { status: sp.status } : {}),
    ...(q ? { OR: [{ email: { contains: q.toLowerCase() } }, { name: { contains: q } }, { subject: { contains: q } }, { orderNumber: { contains: q } }] } : {}),
  };
  const [rows, total] = await Promise.all([prisma.contactInquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER }), prisma.contactInquiry.count({ where })]);
  const qs = (over: Record<string, string | undefined>) => `/admin/inquiries?${new URLSearchParams(Object.entries({ ...sp, ...over }).filter(([, v]) => v) as [string, string][])}`;
  return (
    <div>
      <PageHeader title="Inquiries" description="Messages from the Contact Us form" />
      <FilterTabs active={sp.status ?? ""} tabs={[{ key: "", label: "All" }, { key: "NEW", label: "New" }, { key: "IN_PROGRESS", label: "In progress" }, { key: "RESOLVED", label: "Resolved" }].map((t) => ({ ...t, href: qs({ status: t.key || undefined, page: undefined }) }))} />
      <form action="/admin/inquiries" className="mb-4 flex gap-2">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input name="q" defaultValue={q} placeholder="Search email, name, subject, order" className="input h-9 sm:w-80" />
        <button className="btn-outline btn-sm">Search</button>
      </form>
      <Table head={["From", "Subject", "Order", "Status", "Received"]} empty="No inquiries.">
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-white/[0.02]">
            <td className={td}><Link href={`/admin/inquiries/${r.id}`} className="text-ink hover:underline">{r.name}</Link><div className="text-xs text-ink-muted">{r.email}</div></td>
            <td className={`${td} max-w-[300px] truncate`}>{r.subject || r.message.slice(0, 80)}</td>
            <td className={td}>{r.orderNumber ?? "—"}</td>
            <td className={td}><Badge tone={TONE[r.status]} label={r.status.replace("_", " ").toLowerCase()} /></td>
            <td className={`${td} whitespace-nowrap`}>{fmtDate(r.createdAt)}</td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pages={Math.ceil(total / PER)} makeHref={(p) => qs({ page: String(p) })} />
    </div>
  );
}
