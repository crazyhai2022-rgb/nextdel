import type { MetadataRoute } from "next";
export const dynamic = "force-dynamic";
import { getSetting } from "@/lib/settings";
import { siteUrl } from "@/lib/env";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getSetting("seo");
  return {
    rules: seo.allowIndexing
      ? [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/cart", "/checkout", "/payment", "/thank-you"] }]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
