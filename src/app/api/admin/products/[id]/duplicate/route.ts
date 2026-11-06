import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleError, json, jsonError } from "@/lib/http";
import { audit } from "@/lib/audit";
import { uniqueSlug } from "@/lib/product-input";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req, "products");
    const { id } = await params;
    const p = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { images: true, videos: true, features: true, faqs: true, downloads: true, accessLinks: true, relatedTo: true },
    });
    if (!p) return jsonError("Product not found", 404);
    const { id: _id, createdAt: _c, updatedAt: _u, publishedAt: _p, deletedAt: _d, images, videos, features, faqs, downloads, accessLinks, relatedTo, ...rest } = p;
    const copy = await prisma.product.create({
      data: {
        ...rest,
        title: `${p.title} (Copy)`.slice(0, 200),
        slug: await uniqueSlug(`${p.slug}-copy`),
        status: "DRAFT",
        featured: false,
        images: { create: images.map(({ id: _, productId: __, ...i }) => i) },
        videos: { create: videos.map(({ id: _, productId: __, ...v }) => v) },
        features: { create: features.map(({ id: _, productId: __, ...f }) => f) },
        faqs: { create: faqs.map(({ id: _, productId: __, ...f }) => f) },
        downloads: { create: downloads.map(({ id: _, productId: __, createdAt: ___, ...d }) => d) },
        accessLinks: { create: accessLinks.map(({ id: _, productId: __, ...l }) => l) },
        relatedTo: { create: relatedTo.map((r) => ({ toId: r.toId, sortOrder: r.sortOrder })) },
      },
    });
    await audit(admin.id, "product_duplicated", { entity: "product", entityId: copy.id, details: { from: id } });
    return json({ ok: true, id: copy.id, message: "Duplicated as draft" });
  } catch (e) {
    return handleError(e);
  }
}
