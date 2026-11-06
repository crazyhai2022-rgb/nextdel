import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { plainText } from "@/lib/sanitize";

type Params = { params: Promise<{ page: string }> };

async function load(slug: string) {
  if (!/^[a-z0-9-]{2,100}$/.test(slug) || slug === "contact-us") return null;
  return prisma.page.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = await load((await params).page);
  if (!page) return { title: "Page not found" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || plainText(page.content, 160),
    alternates: { canonical: `/${page.slug}` },
  };
}

export default async function CmsPage({ params }: Params) {
  const page = await load((await params).page);
  if (!page) notFound();
  return (
    <div className="container-site py-10 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <h1 className="heading-spaced border-b border-line pb-4 text-[15px] sm:text-base">{page.title}</h1>
        <p className="mt-3 text-xs text-ink-muted">Last updated {page.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        <div className="rich mt-8" dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>
    </div>
  );
}
