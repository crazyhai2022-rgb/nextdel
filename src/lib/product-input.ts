import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { cleanHtml, plainText, safeUrl } from "./sanitize";
import { toPaise } from "./money";
import { statFile } from "./storage";
import { HttpError } from "./http";

const mediaUrl = z.string().trim().max(500).refine((u) => u === "" || u.startsWith("/media/") || /^https:\/\//.test(u), "Must be an uploaded file or https URL");
const optUrl = z.string().trim().max(1000).optional().default("");

export const productSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().max(191).optional().default(""),
  shortDescription: z.string().max(2000).optional().default(""),
  description: z.string().max(500000).optional().default(""),
  overview: z.string().max(200000).optional().default(""),
  accessInstructions: z.string().max(100000).optional().default(""),
  originalPrice: z.coerce.number().min(0).max(10_000_000),
  salePrice: z.coerce.number().min(1, "Sale price must be at least ₹1").max(10_000_000),
  lifetimeLabel: z.string().max(60).optional().default("Lifetime Access"),
  accessInfo: z.string().max(200).optional().default(""),
  thumbnailUrl: mediaUrl.optional().default(""),
  thumbnailAlt: z.string().max(200).optional().default(""),
  bannerUrl: mediaUrl.optional().default(""),
  status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED"]),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
  demoEnabled: z.boolean().default(false),
  demoLinkType: z.enum(["GROUP", "CHANNEL", "INVITE"]).default("GROUP"),
  demoGroupUrl: optUrl,
  demoChannelUrl: optUrl,
  demoInviteUrl: optUrl,
  demoButtonText: z.string().max(60).optional().default(""),
  relatedMode: z.enum(["AUTO", "MANUAL"]).default("AUTO"),
  relatedIds: z.array(z.string().max(40)).max(12).default([]),
  seoTitle: z.string().max(200).optional().default(""),
  seoDescription: z.string().max(500).optional().default(""),
  images: z.array(z.object({ url: mediaUrl, alt: z.string().max(200).optional().default(""), kind: z.enum(["GALLERY", "PREVIEW", "CONTENT"]).default("GALLERY") })).max(40).default([]),
  videos: z.array(z.object({ kind: z.enum(["EMBED", "UPLOAD"]), url: z.string().trim().min(1).max(500), title: z.string().max(200).optional().default(""), posterUrl: mediaUrl.optional().default(""), isPreview: z.boolean().default(false) })).max(20).default([]),
  features: z.array(z.object({ type: z.enum(["FEATURE", "BENEFIT", "INCLUDED", "OUTCOME"]), text: z.string().trim().min(1).max(500) })).max(100).default([]),
  faqs: z.array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(5000) })).max(50).default([]),
  downloads: z.array(z.object({ id: z.string().optional(), storageKey: z.string().max(255), fileName: z.string().trim().min(1).max(255), mimeType: z.string().max(100), size: z.coerce.number().int().min(0) })).max(20).default([]),
  accessLinks: z.array(z.object({ label: z.string().trim().min(1).max(120), url: z.string().trim().min(1).max(1000) })).max(20).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;

export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "product";
}

export async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugify(base);
  for (let i = 2; ; i++) {
    const hit = await prisma.product.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) }, select: { id: true } });
    if (!hit) return slug;
    slug = `${slugify(base).slice(0, 110)}-${i}`;
  }
}

function tgOrHttp(u: string) {
  return u ? safeUrl(u, true) : null;
}

/** Converts validated input into Prisma data. Throws on invalid links/files. */
export async function buildProductData(input: ProductInput, id?: string) {
  if (input.originalPrice && input.originalPrice < input.salePrice) throw new HttpError(422, "Original price can't be lower than the discounted price.");
  for (const k of ["demoGroupUrl", "demoChannelUrl", "demoInviteUrl"] as const) {
    if (input[k] && !tgOrHttp(input[k])) throw new HttpError(422, `${k}: invalid link (use https://t.me/...)`);
  }
  if (input.demoEnabled && !(input.demoGroupUrl || input.demoChannelUrl || input.demoInviteUrl)) throw new HttpError(422, "Add at least one Telegram link to enable the Free Demo button.");
  for (const l of input.accessLinks) if (!safeUrl(l.url, true)) throw new HttpError(422, `Invalid access link: ${l.url}`);
  for (const d of input.downloads) {
    if (!(await statFile("private", d.storageKey))) throw new HttpError(422, `Uploaded file not found: ${d.fileName}. Please re-upload.`);
  }
  for (const v of input.videos) {
    if (v.kind === "UPLOAD" && !v.url.startsWith("/media/")) throw new HttpError(422, "Uploaded video URL is invalid");
    if (v.kind === "EMBED" && !safeUrl(v.url)) throw new HttpError(422, `Invalid video link: ${v.url}`);
  }
  const slug = await uniqueSlug(input.slug || input.title, id);
  const original = toPaise(input.originalPrice || input.salePrice);
  const data = {
    title: plainText(input.title, 200),
    slug,
    shortDescription: plainText(input.shortDescription, 2000) || null,
    description: cleanHtml(input.description) || null,
    overview: cleanHtml(input.overview) || null,
    accessInstructions: cleanHtml(input.accessInstructions) || null,
    originalPrice: original,
    salePrice: toPaise(input.salePrice),
    lifetimeLabel: plainText(input.lifetimeLabel, 60) || null,
    accessInfo: plainText(input.accessInfo, 200) || null,
    thumbnailUrl: input.thumbnailUrl || null,
    thumbnailAlt: plainText(input.thumbnailAlt, 200) || null,
    bannerUrl: input.bannerUrl || null,
    status: input.status,
    featured: input.featured,
    visible: input.visible,
    sortOrder: input.sortOrder,
    demoEnabled: input.demoEnabled,
    demoLinkType: input.demoLinkType,
    demoGroupUrl: tgOrHttp(input.demoGroupUrl),
    demoChannelUrl: tgOrHttp(input.demoChannelUrl),
    demoInviteUrl: tgOrHttp(input.demoInviteUrl),
    demoButtonText: plainText(input.demoButtonText, 60) || null,
    relatedMode: input.relatedMode,
    seoTitle: plainText(input.seoTitle, 200) || null,
    seoDescription: plainText(input.seoDescription, 500) || null,
  } satisfies Prisma.ProductUncheckedCreateInput;
  return data;
}

/** Replaces child collections inside a transaction. */
export async function writeChildren(tx: Prisma.TransactionClient, productId: string, input: ProductInput) {
  await tx.productImage.deleteMany({ where: { productId } });
  await tx.productVideo.deleteMany({ where: { productId } });
  await tx.productFeature.deleteMany({ where: { productId } });
  await tx.productFaq.deleteMany({ where: { productId } });
  await tx.productAccessLink.deleteMany({ where: { productId } });
  await tx.productRelation.deleteMany({ where: { fromId: productId } });

  if (input.images.length) await tx.productImage.createMany({ data: input.images.filter((i) => i.url).map((i, n) => ({ productId, url: i.url, alt: plainText(i.alt, 200) || null, kind: i.kind, sortOrder: n })) });
  if (input.videos.length) await tx.productVideo.createMany({ data: input.videos.map((v, n) => ({ productId, kind: v.kind, url: v.url, title: plainText(v.title, 200) || null, posterUrl: v.posterUrl || null, isPreview: v.isPreview, sortOrder: n })) });
  if (input.features.length) await tx.productFeature.createMany({ data: input.features.map((f, n) => ({ productId, type: f.type, text: plainText(f.text, 500), sortOrder: n })) });
  if (input.faqs.length) await tx.productFaq.createMany({ data: input.faqs.map((f, n) => ({ productId, question: plainText(f.question, 300), answer: plainText(f.answer, 5000), sortOrder: n })) });
  if (input.accessLinks.length) await tx.productAccessLink.createMany({ data: input.accessLinks.map((l, n) => ({ productId, label: plainText(l.label, 120), url: safeUrl(l.url, true)!, sortOrder: n })) });

  // Downloads: keep existing rows (preserves download logs), add new, remove dropped.
  const keepIds = input.downloads.filter((d) => d.id).map((d) => d.id!) as string[];
  await tx.productDownload.deleteMany({ where: { productId, id: { notIn: keepIds.length ? keepIds : ["__none__"] } } });
  for (const [n, d] of input.downloads.entries()) {
    if (d.id) await tx.productDownload.updateMany({ where: { id: d.id, productId }, data: { fileName: plainText(d.fileName, 255), sortOrder: n } });
    else await tx.productDownload.create({ data: { productId, storageKey: d.storageKey, fileName: plainText(d.fileName, 255), mimeType: d.mimeType, size: d.size, sortOrder: n } });
  }

  const related = [...new Set(input.relatedIds)].filter((r) => r !== productId);
  if (related.length) {
    const exists = await tx.product.findMany({ where: { id: { in: related } }, select: { id: true } });
    await tx.productRelation.createMany({ data: exists.map((e) => ({ fromId: productId, toId: e.id, sortOrder: related.indexOf(e.id) })) });
  }
}
