import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { PageHeader, Pagination, Table, td, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Audit Log" };
const PER = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await guardPage("audit");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.q ? { action: { contains: sp.q } } : {};
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { admin: { select: { email: true } } } }),
    prisma.auditLog.count({ where }),
  ]);
  return (
    <div>
      <PageHeader title="Audit log" description="Important admin actions" />
      <form action="/admin/audit" className="mb-4 flex gap-2"><input name="q" defaultValue={sp.q} placeholder="Filter by action (e.g. product, login, settings)" className="input h-9 sm:w-80" /><button className="btn-outline btn-sm">Filter</button></form>
      <Table head={["When", "Admin", "Action", "Entity", "Details", "IP"]}>
        {logs.map((l) => (
          <tr key={l.id}>
            <td className={`${td} whitespace-nowrap`}>{fmtDate(l.createdAt)}</td>
            <td className={td}>{l.admin?.email ?? "—"}</td>
            <td className={td}><span className="text-ink">{l.action.replace(/_/g, " ")}</span></td>
            <td className={`${td} text-xs`}>{l.entity}{l.entityId ? ` · ${l.entityId}` : ""}</td>
            <td className={`${td} max-w-[320px] truncate text-xs`} title={l.details ? JSON.stringify(l.details) : ""}>{l.details ? JSON.stringify(l.details) : ""}</td>
            <td className={`${td} text-xs`}>{l.ip}</td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pages={Math.ceil(total / PER)} makeHref={(p) => `/admin/audit?page=${p}${sp.q ? `&q=${encodeURIComponent(sp.q)}` : ""}`} />
    </div>
  );
}
