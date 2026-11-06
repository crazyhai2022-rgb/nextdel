import Link from "next/link";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { Badge, PageHeader, Table, td, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Pages" };

export default async function PagesAdmin() {
  await guardPage("pages");
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  return (
    <div>
      <PageHeader title="Pages (CMS)" description="About, Contact, FAQ and legal pages. Footer & homepage content are under Settings." />
      <Table head={["Page", "URL", "Status", "Updated", ""]} empty="No pages. Run the database seed to create defaults.">
        {pages.map((p) => (
          <tr key={p.id}>
            <td className={td}><Link href={`/admin/pages/${p.slug}`} className="text-ink hover:underline">{p.title}</Link></td>
            <td className={td}>/{p.slug}</td>
            <td className={td}><Badge tone={p.published ? "green" : "zinc"} label={p.published ? "Published" : "Unpublished"} /></td>
            <td className={td}>{fmtDate(p.updatedAt)}</td>
            <td className={td}><div className="flex gap-2"><Link href={`/admin/pages/${p.slug}`} className="btn-outline btn-sm">Edit</Link>{p.published && <a href={`/${p.slug}`} target="_blank" className="btn-ghost btn-sm">View ↗</a>}</div></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
