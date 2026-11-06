import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { clientIp, handleError, json } from "@/lib/http";
import { audit } from "@/lib/audit";
import { buildProductData, productSchema, writeChildren } from "@/lib/product-input";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req, "products");
    const input = productSchema.parse(await req.json());
    const data = await buildProductData(input);
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({ data: { ...data, publishedAt: data.status === "PUBLISHED" ? new Date() : null } });
      await writeChildren(tx, p.id, input);
      return p;
    });
    await audit(admin.id, "product_created", { entity: "product", entityId: product.id, details: { title: product.title }, ip: clientIp(req) });
    return json({ ok: true, id: product.id, slug: product.slug });
  } catch (e) {
    return handleError(e);
  }
}
