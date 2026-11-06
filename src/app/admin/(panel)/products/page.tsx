import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { formatMoney } from "@/lib/money";
import { Badge, FilterTabs, PageHeader, Table, td, fmtDate } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/client";

export const metadata = { title: "Products" };

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await guardPage("products");
  const sp = await searchParams;
  const q = sp.q?.trim();
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(sp.status === "PUBLISHED" || sp.status === "DRAFT" || sp.status === "UNPUBLISHED" ? { status: sp.status } : {}),
    ...(sp.status === "featured" ? { featured: true } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { slug: { contains: q } }] } : {}),
  };
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { downloads: true, accessLinks: true } }, orderItems: { where: { order: { status: "PAID" } }, select: { unitPrice: true } } },
  });
  const tone = { PUBLISHED: "green", DRAFT: "zinc", UNPUBLISHED: "amber" } as const;
  return (
    <div>
      <PageHeader title="Products" description={`${products.length} product${products.length === 1 ? "" : "s"}`} actions={<Link href="/admin/products/new" className="btn-primary btn-sm">Add product</Link>} />
      <FilterTabs active={sp.status ?? ""} tabs={[{ key: "", label: "All" }, { key: "PUBLISHED", label: "Published" }, { key: "DRAFT", label: "Drafts" }, { key: "UNPUBLISHED", label: "Unpublished" }, { key: "featured", label: "Featured" }].map((t) => ({ ...t, href: `/admin/products?${new URLSearchParams({ ...(t.key ? { status: t.key } : {}), ...(q ? { q } : {}) })}` }))} />
      <form action="/admin/products" className="mb-4 flex gap-2">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <input name="q" defaultValue={q} placeholder="Search products" className="input h-9 sm:w-72" />
        <button className="btn-outline btn-sm">Search</button>
      </form>
      <Table head={["Product", "Price", "Delivery", "Sales", "Status", "Updated", "Actions"]} empty="No products yet. Click “Add product” to create your first one.">
        {products.map((p) => (
          <tr key={p.id} className="hover:bg-white/[0.02]">
            <td className={td}>
              <div className="flex items-center gap-3">
                <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.thumbnailUrl && <img src={p.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0">
                  <Link href={`/admin/products/${p.id}`} className="block truncate font-medium text-ink hover:underline">{p.title}</Link>
                  <span className="text-xs text-ink-muted">/{p.slug}{p.featured && " · ★ featured"}{!p.visible && " · hidden"}</span>
                </span>
              </div>
            </td>
            <td className={`${td} whitespace-nowrap`}>{formatMoney(p.salePrice)}{p.originalPrice > p.salePrice && <div className="text-xs text-ink-muted line-through">{formatMoney(p.originalPrice)}</div>}</td>
            <td className={`${td} text-xs`}>{p._count.downloads} file{p._count.downloads === 1 ? "" : "s"} · {p._count.accessLinks} link{p._count.accessLinks === 1 ? "" : "s"}{p._count.downloads + p._count.accessLinks === 0 && <div className="text-amber-300">No delivery set</div>}</td>
            <td className={`${td} whitespace-nowrap`}>{p.orderItems.length}<div className="text-xs text-ink-muted">{formatMoney(p.orderItems.reduce((s, i) => s + i.unitPrice, 0))}</div></td>
            <td className={td}><Badge tone={tone[p.status]} label={p.status.toLowerCase()} /></td>
            <td className={`${td} whitespace-nowrap`}>{fmtDate(p.updatedAt, false)}</td>
            <td className={td}>
              <div className="flex flex-wrap gap-1.5">
                <Link href={`/admin/products/${p.id}`} className="btn-outline btn-sm">Edit</Link>
                {p.status === "PUBLISHED" ? (
                  <ActionButton url={`/api/admin/products/${p.id}`} method="PATCH" body={{ status: "UNPUBLISHED" }} label="Unpublish" />
                ) : (
                  <ActionButton url={`/api/admin/products/${p.id}`} method="PATCH" body={{ status: "PUBLISHED" }} label="Publish" />
                )}
                <ActionButton url={`/api/admin/products/${p.id}/duplicate`} label="Duplicate" />
                {p.status === "PUBLISHED" && <a href={`/product/${p.slug}`} target="_blank" className="btn-ghost btn-sm">View ↗</a>}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
