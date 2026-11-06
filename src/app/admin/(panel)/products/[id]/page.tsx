import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { toRupees } from "@/lib/money";
import { PageHeader } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/client";
import { ProductForm, type ProductFormValue } from "@/components/admin/ProductForm";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await guardPage("products");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const p = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      videos: { orderBy: { sortOrder: "asc" } },
      features: { orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      downloads: { orderBy: { sortOrder: "asc" } },
      accessLinks: { orderBy: { sortOrder: "asc" } },
      relatedTo: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p) notFound();
  const all = await prisma.product.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { title: "asc" } });

  const initial: ProductFormValue = {
    title: p.title, slug: p.slug, shortDescription: p.shortDescription ?? "", description: p.description ?? "", overview: p.overview ?? "", accessInstructions: p.accessInstructions ?? "",
    originalPrice: toRupees(p.originalPrice), salePrice: toRupees(p.salePrice), lifetimeLabel: p.lifetimeLabel ?? "", accessInfo: p.accessInfo ?? "",
    thumbnailUrl: p.thumbnailUrl ?? "", thumbnailAlt: p.thumbnailAlt ?? "", bannerUrl: p.bannerUrl ?? "", status: p.status, featured: p.featured, visible: p.visible, sortOrder: p.sortOrder,
    demoEnabled: p.demoEnabled, demoLinkType: (p.demoLinkType as ProductFormValue["demoLinkType"]) ?? "GROUP", demoGroupUrl: p.demoGroupUrl ?? "", demoChannelUrl: p.demoChannelUrl ?? "", demoInviteUrl: p.demoInviteUrl ?? "", demoButtonText: p.demoButtonText ?? "",
    relatedMode: p.relatedMode === "MANUAL" ? "MANUAL" : "AUTO", relatedIds: p.relatedTo.map((r) => r.toId), seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "",
    images: p.images.map((i) => ({ url: i.url, alt: i.alt ?? "", kind: i.kind as "GALLERY" | "PREVIEW" | "CONTENT" })),
    videos: p.videos.map((v) => ({ kind: v.kind as "EMBED" | "UPLOAD", url: v.url, title: v.title ?? "", posterUrl: v.posterUrl ?? "", isPreview: v.isPreview })),
    features: p.features.map((f) => ({ type: f.type as ProductFormValue["features"][number]["type"], text: f.text })),
    faqs: p.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    downloads: p.downloads.map((d) => ({ id: d.id, storageKey: d.storageKey, fileName: d.fileName, mimeType: d.mimeType, size: d.size })),
    accessLinks: p.accessLinks.map((l) => ({ label: l.label, url: l.url })),
  };

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-ink-muted hover:text-ink">← Products</Link>
      <PageHeader
        title={p.title}
        description={sp.created ? "Product created. You can keep editing below." : `/product/${p.slug}`}
        actions={
          <>
            {p.status === "PUBLISHED" && <a href={`/product/${p.slug}`} target="_blank" className="btn-outline btn-sm">View on site ↗</a>}
            <ActionButton url={`/api/admin/products/${p.id}/duplicate`} label="Duplicate" />
            <ActionButton url={`/api/admin/products/${p.id}`} method="DELETE" label="Delete" confirm="Delete this product? It will be removed from the store. Existing orders keep their records." redirect="/admin/products" className="btn-sm btn border border-red-400/40 text-red-200 hover:bg-red-400/10" />
          </>
        }
      />
      <ProductForm id={p.id} initial={initial} allProducts={all} />
    </div>
  );
}
