import { prisma } from "@/lib/db";
import { publicProductWhere } from "@/lib/products";
import { json } from "@/lib/http";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return json({ results: [] });
  const results = await prisma.product.findMany({
    where: { ...publicProductWhere, visible: true, title: { contains: q } },
    select: { slug: true, title: true, salePrice: true, thumbnailUrl: true },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 6,
  });
  return json({ results });
}
