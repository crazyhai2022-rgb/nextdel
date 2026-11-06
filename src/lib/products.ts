import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export const publicProductWhere: Prisma.ProductWhereInput = { status: "PUBLISHED", deletedAt: null };

export const cardSelect = {
  id: true,
  title: true,
  slug: true,
  thumbnailUrl: true,
  thumbnailAlt: true,
  originalPrice: true,
  salePrice: true,
  lifetimeLabel: true,
  featured: true,
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export type SortKey = "featured" | "latest" | "price_asc" | "price_desc";

export function orderByFor(sort: SortKey): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "latest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "price_asc":
      return [{ salePrice: "asc" }];
    case "price_desc":
      return [{ salePrice: "desc" }];
    default:
      return [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }];
  }
}

export async function listProducts(opts: { sort?: SortKey; q?: string; take?: number; featuredOnly?: boolean } = {}) {
  const q = opts.q?.trim();
  return prisma.product.findMany({
    where: {
      ...publicProductWhere,
      visible: true,
      ...(opts.featuredOnly ? { featured: true } : {}),
      ...(q ? { OR: [{ title: { contains: q } }, { shortDescription: { contains: q } }] } : {}),
    },
    orderBy: orderByFor(opts.sort ?? "featured"),
    take: opts.take ?? 60,
    select: cardSelect,
  });
}

/** Product detail — NOTE: never selects downloads or access links (those are post-purchase only). */
export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, ...publicProductWhere },
    select: {
      ...cardSelect,
      shortDescription: true,
      description: true,
      overview: true,
      accessInstructions: true,
      accessInfo: true,
      bannerUrl: true,
      demoEnabled: true,
      demoLinkType: true,
      demoGroupUrl: true,
      demoChannelUrl: true,
      demoInviteUrl: true,
      demoButtonText: true,
      relatedMode: true,
      seoTitle: true,
      seoDescription: true,
      updatedAt: true,
      images: { orderBy: { sortOrder: "asc" } },
      videos: { orderBy: { sortOrder: "asc" } },
      features: { orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      relatedTo: { orderBy: { sortOrder: "asc" }, select: { to: { select: { ...cardSelect, status: true, deletedAt: true } } } },
      _count: { select: { downloads: true, accessLinks: true } },
    },
  });
}

export async function getRelated(product: { id: string; relatedMode: string; relatedTo: { to: ProductCardData & { status: string; deletedAt: Date | null } }[] }, take = 4) {
  const manual = product.relatedTo.map((r) => r.to).filter((p) => p.status === "PUBLISHED" && !p.deletedAt);
  if (product.relatedMode === "MANUAL" && manual.length) return manual.slice(0, take);
  const exclude = [product.id, ...manual.map((m) => m.id)];
  const auto = await prisma.product.findMany({
    where: { ...publicProductWhere, visible: true, id: { notIn: exclude } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: take - Math.min(manual.length, take),
    select: cardSelect,
  });
  return [...manual, ...auto].slice(0, take);
}

export function demoLink(p: { demoEnabled: boolean; demoLinkType: string; demoGroupUrl: string | null; demoChannelUrl: string | null; demoInviteUrl: string | null }) {
  if (!p.demoEnabled) return null;
  const pref = { GROUP: p.demoGroupUrl, CHANNEL: p.demoChannelUrl, INVITE: p.demoInviteUrl }[p.demoLinkType as "GROUP" | "CHANNEL" | "INVITE"];
  return pref || p.demoInviteUrl || p.demoGroupUrl || p.demoChannelUrl || null;
}

export function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop();
      if (u.pathname.startsWith("/embed/")) return `https://www.youtube-nocookie.com${u.pathname}`;
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return u.hostname.startsWith("player.") ? url : id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {}
  return null;
}
