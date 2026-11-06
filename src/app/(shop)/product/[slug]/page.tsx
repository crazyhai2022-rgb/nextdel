import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoLink, getProductBySlug, getRelated, youtubeEmbed } from "@/lib/products";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/env";
import { plainText } from "@/lib/sanitize";
import { Price } from "@/components/shop/Price";
import { BuyBox } from "@/components/shop/BuyBox";
import { MediaGallery, type MediaItem } from "@/components/shop/MediaGallery";
import { ProductGrid } from "@/components/shop/ProductCard";
import { CheckIcon, InfinityIcon, LockIcon, ShieldIcon, DownloadIcon, LinkIcon } from "@/components/icons";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const description = p.seoDescription || plainText(p.shortDescription, 160) || undefined;
  const image = p.bannerUrl || p.thumbnailUrl;
  return {
    title: p.seoTitle || p.title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { type: "website", title: p.seoTitle || p.title, description, images: image ? [{ url: image, alt: p.title }] : undefined },
  };
}

const SECTION: Record<string, string> = {
  FEATURE: "Key features",
  INCLUDED: "What's included",
  OUTCOME: "What you'll get",
  BENEFIT: "Benefits",
};

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const [{ general, checkout }, related] = await Promise.all([getSettings("general", "checkout"), getRelated(p)]);

  const media: MediaItem[] = [];
  const hero = p.bannerUrl || p.thumbnailUrl;
  if (hero) media.push({ type: "image", src: hero, alt: p.thumbnailAlt || p.title });
  for (const v of p.videos.filter((v) => v.isPreview)) {
    const embed = v.kind === "EMBED" ? youtubeEmbed(v.url) : null;
    if (embed) media.push({ type: "embed", src: embed, title: v.title || p.title, poster: v.posterUrl });
    else if (v.kind === "UPLOAD") media.push({ type: "video", src: v.url, title: v.title || p.title, poster: v.posterUrl });
  }
  for (const img of p.images.filter((i) => i.kind !== "CONTENT")) media.push({ type: "image", src: img.url, alt: img.alt || p.title });

  const contentImages = p.images.filter((i) => i.kind === "CONTENT");
  const bodyVideos = p.videos.filter((v) => !v.isPreview);
  const groups = ["FEATURE", "INCLUDED", "OUTCOME", "BENEFIT"]
    .map((t) => ({ type: t, items: p.features.filter((f) => f.type === t) }))
    .filter((g) => g.items.length);
  const demo = demoLink(p);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    description: plainText(p.shortDescription || p.description, 500),
    image: hero ? [hero.startsWith("http") ? hero : siteUrl() + hero] : undefined,
    brand: { "@type": "Brand", name: general.siteName },
    offers: {
      "@type": "Offer",
      price: (p.salePrice / 100).toFixed(2),
      priceCurrency: general.currency || "INR",
      availability: "https://schema.org/InStock",
      url: `${siteUrl()}/product/${p.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container-site py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12">
          <MediaGallery items={media} title={p.title} />

          <div className="lg:pt-1">
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink sm:text-[30px]">{p.title}</h1>
            {p.shortDescription && <p className="mt-3 text-[15.5px] leading-7 text-ink-soft">{p.shortDescription}</p>}

            <div className="mt-6 card p-5">
              <Price sale={p.salePrice} original={p.originalPrice} size="lg" currency={general.currency} />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {p.lifetimeLabel && <span className="lifetime text-[13px]"><InfinityIcon size={16} /> {p.lifetimeLabel}</span>}
                {p._count.downloads > 0 && <span className="inline-flex items-center gap-1 text-[13px] text-ink-soft"><DownloadIcon size={15} /> Instant download</span>}
                {p._count.accessLinks > 0 && <span className="inline-flex items-center gap-1 text-[13px] text-ink-soft"><LinkIcon size={15} /> Online access</span>}
              </div>
              {p.accessInfo && <p className="mt-2 text-[13px] text-ink-muted">{p.accessInfo}</p>}
              <div className="mt-5">
                <BuyBox
                  currency={general.currency}
                  item={{ productId: p.id, slug: p.slug, title: p.title, thumbnailUrl: p.thumbnailUrl, salePrice: p.salePrice, originalPrice: p.originalPrice }}
                  demo={demo ? { url: demo, label: p.demoButtonText || "Join Free Demo" } : null}
                />
              </div>
              <div className="mt-5 space-y-2 border-t border-line pt-4 text-[13px] text-ink-muted">
                <p className="flex items-start gap-2"><LockIcon size={16} className="mt-0.5 shrink-0" /> {checkout.secureNote}</p>
                <p className="flex items-start gap-2"><ShieldIcon size={16} className="mt-0.5 shrink-0" /> Delivered to your email immediately after payment is verified.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12">
          <div className="min-w-0 space-y-12">
            {p.overview && (
              <section>
                <h2 className="heading-spaced mb-4 text-[13px]">Overview</h2>
                <div className="rich" dangerouslySetInnerHTML={{ __html: p.overview }} />
              </section>
            )}
            {p.description && (
              <section>
                <h2 className="heading-spaced mb-4 text-[13px]">Description</h2>
                <div className="rich" dangerouslySetInnerHTML={{ __html: p.description }} />
              </section>
            )}
            {bodyVideos.length > 0 && (
              <section className="space-y-4">
                <h2 className="heading-spaced text-[13px]">Videos</h2>
                {bodyVideos.map((v) => {
                  const embed = v.kind === "EMBED" ? youtubeEmbed(v.url) : null;
                  return (
                    <figure key={v.id}>
                      <div className="aspect-video overflow-hidden rounded-xl border border-line bg-black">
                        {embed ? (
                          <iframe src={embed} title={v.title || p.title} className="h-full w-full" allowFullScreen loading="lazy" />
                        ) : (
                          <video src={v.url} poster={v.posterUrl ?? undefined} controls playsInline preload="metadata" className="h-full w-full object-contain" />
                        )}
                      </div>
                      {v.title && <figcaption className="mt-2 text-sm text-ink-muted">{v.title}</figcaption>}
                    </figure>
                  );
                })}
              </section>
            )}
            {contentImages.length > 0 && (
              <section className="grid gap-4 sm:grid-cols-2">
                {contentImages.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} src={img.url} alt={img.alt || p.title} loading="lazy" className="w-full rounded-xl border border-line" />
                ))}
              </section>
            )}
            {p.accessInstructions && (
              <section>
                <h2 className="heading-spaced mb-4 text-[13px]">How you&apos;ll get access</h2>
                <div className="rich" dangerouslySetInnerHTML={{ __html: p.accessInstructions }} />
              </section>
            )}
          </div>

          <aside className="min-w-0 space-y-8">
            {groups.map((g) => (
              <section key={g.type} className="card p-5">
                <h2 className="heading-spaced mb-4 text-[12px]">{SECTION[g.type]}</h2>
                <ul className="space-y-2.5">
                  {g.items.map((f) => (
                    <li key={f.id} className="flex gap-2.5 text-[14.5px] leading-6 text-ink-soft">
                      <CheckIcon size={18} className="mt-0.5 shrink-0 text-rose" /> <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {p.faqs.length > 0 && (
              <section>
                <h2 className="heading-spaced mb-3 text-[12px]">Frequently asked questions</h2>
                <div className="divide-y divide-line rounded-2xl border border-line bg-surface/50">
                  {p.faqs.map((f) => (
                    <details key={f.id} className="group px-5 py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14.5px] font-medium text-ink">
                        {f.question}
                        <span className="text-ink-muted transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-2 whitespace-pre-line text-[14px] leading-6 text-ink-soft">{f.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-20 border-t border-line pt-10">
            <h2 className="heading-spaced mb-8 text-[14px]">You may also like</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </>
  );
}
