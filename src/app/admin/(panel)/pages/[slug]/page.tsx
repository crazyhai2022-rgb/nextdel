import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { PageHeader } from "@/components/admin/ui";
import { PageForm } from "@/components/admin/PageForm";

export const metadata = { title: "Edit page" };

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  await guardPage("pages");
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) notFound();
  return (
    <div>
      <Link href="/admin/pages" className="text-sm text-ink-muted hover:text-ink">← Pages</Link>
      <PageHeader title={`Edit: ${page.title}`} description={`/${page.slug}`} />
      <PageForm slug={page.slug} initial={{ title: page.title, content: page.content, seoTitle: page.seoTitle ?? "", seoDescription: page.seoDescription ?? "", published: page.published }} />
    </div>
  );
}
