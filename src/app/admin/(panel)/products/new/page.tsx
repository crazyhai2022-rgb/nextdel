import Link from "next/link";
import { prisma } from "@/lib/db";
import { guardPage } from "@/lib/admin-guard";
import { PageHeader } from "@/components/admin/ui";
import { EMPTY_PRODUCT, ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  await guardPage("products");
  const all = await prisma.product.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { title: "asc" } });
  return (
    <div>
      <Link href="/admin/products" className="text-sm text-ink-muted hover:text-ink">← Products</Link>
      <PageHeader title="New product" />
      <ProductForm initial={EMPTY_PRODUCT} allProducts={all} />
    </div>
  );
}
