import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { formatMoney } from "@/lib/money";
import { PageHeader, Pagination, SearchForm, Table, td, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Customers" };
const PER = 30;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await guardPage("customers");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim();
  const where: Prisma.CustomerWhereInput = q ? { OR: [{ email: { contains: q.toLowerCase() } }, { name: { contains: q } }, { phone: { contains: q } }] } : {};
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PER, take: PER, include: { orders: { select: { status: true, total: true } } } }),
    prisma.customer.count({ where }),
  ]);
  return (
    <div>
      <PageHeader title="Customers" description={`${total} customer${total === 1 ? "" : "s"}`} actions={<SearchForm action="/admin/customers" defaultValue={q} placeholder="Search by email, name, phone" />} />
      <Table head={["Customer", "Phone", "Orders", "Paid orders", "Total spent", "Last activity"]} empty="No customers found.">
        {customers.map((c) => {
          const paid = c.orders.filter((o) => o.status === "PAID");
          return (
            <tr key={c.id} className="hover:bg-white/[0.02]">
              <td className={td}><Link href={`/admin/customers/${c.id}`} className="text-ink hover:underline">{c.name}</Link><div className="text-xs text-ink-muted">{c.email}</div></td>
              <td className={td}>{c.phone ?? "—"}</td>
              <td className={td}>{c.orders.length}</td>
              <td className={td}>{paid.length}</td>
              <td className={td}>{formatMoney(paid.reduce((s, o) => s + o.total, 0))}</td>
              <td className={`${td} whitespace-nowrap`}>{fmtDate(c.updatedAt)}</td>
            </tr>
          );
        })}
      </Table>
      <Pagination page={page} pages={Math.ceil(total / PER)} makeHref={(p) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`} />
    </div>
  );
}
