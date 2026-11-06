import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { clientIp, handleError, json, jsonError } from "@/lib/http";
import { audit } from "@/lib/audit";
import { buildProductData, productSchema, writeChildren } from "@/lib/product-input";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(req, "products");
    const { id } = await params;
    const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return jsonError("Product not found", 404);
    const input = productSchema.parse(await req.json());
    const data = await buildProductData(input, id);
    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { ...data, publishedAt: data.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt } });
      await writeChildren(tx, id, input);
    });
    await audit(admin.id, "product_updated", { entity: "product", entityId: id, details: { title: data.title, status: data.status, price: data.salePrice }, ip: clientIp(req) });
    return json({ ok: true, slug: data.slug, message: "Saved" });
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({ status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]).optional(), featured: z.boolean().optional(), visible: z.boolean().optional() });

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(req, "products");
    const { id } = await params;
    const b = patchSchema.parse(await req.json());
    const p = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!p) return jsonError("Product not found", 404);
    await prisma.product.update({ where: { id }, data: { ...b, ...(b.status === "PUBLISHED" && !p.publishedAt ? { publishedAt: new Date() } : {}) } });
    await audit(admin.id, "product_quick_update", { entity: "product", entityId: id, details: b, ip: clientIp(req) });
    return json({ ok: true, message: "Updated" });
  } catch (e) {
    return handleError(e);
  }
}

/** Soft delete: product disappears from the store; past orders keep their snapshot. */
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const admin = await requireAdmin(req, "products");
    const { id } = await params;
    const p = await prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!p) return jsonError("Product not found", 404);
    await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), status: "UNPUBLISHED", slug: `${p.slug.slice(0, 160)}-deleted-${Date.now().toString(36)}` } });
    await audit(admin.id, "product_deleted", { entity: "product", entityId: id, details: { title: p.title }, ip: clientIp(req) });
    return json({ ok: true, message: "Deleted" });
  } catch (e) {
    return handleError(e);
  }
}
