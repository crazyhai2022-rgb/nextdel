import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, pages] = await Promise.all([
    prisma.product.findMany({ where: { status: "PUBLISHED", deletedAt: null, visible: true }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.9 },
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...pages.map((p) => ({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.4 })),
    { url: `${base}/order-lookup`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
