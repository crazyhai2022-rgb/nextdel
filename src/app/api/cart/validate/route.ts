import { z } from "zod";
import { prisma } from "@/lib/db";
import { publicProductWhere } from "@/lib/products";
import { handleError, json } from "@/lib/http";

const schema = z.object({ productIds: z.array(z.string().min(1).max(40)).max(50) });

/** Returns authoritative product data/prices for cart items. */
export async function POST(req: Request) {
  try {
    const { productIds } = schema.parse(await req.json());
    const ids = [...new Set(productIds)];
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, ...publicProductWhere },
      select: { id: true, slug: true, title: true, thumbnailUrl: true, salePrice: true, originalPrice: true },
    });
    const items = ids
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => ({ productId: p!.id, slug: p!.slug, title: p!.title, thumbnailUrl: p!.thumbnailUrl, salePrice: p!.salePrice, originalPrice: p!.originalPrice }));
    return json({ ok: true, items, removed: ids.length - items.length });
  } catch (e) {
    return handleError(e);
  }
}
