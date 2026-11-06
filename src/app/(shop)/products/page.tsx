import type { Metadata } from "next";
import Link from "next/link";
import { listProducts, type SortKey } from "@/lib/products";
import { ProductGrid } from "@/components/shop/ProductCard";
import { safeQuery } from "@/lib/db";

export const metadata: Metadata = { title: "Products", alternates: { canonical: "/products" } };

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "latest", label: "Latest" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
];

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  const sp = await searchParams;
  const sort = (SORTS.find((s) => s.key === sp.sort)?.key ?? "featured") as SortKey;
  const q = (sp.q ?? "").slice(0, 100);
  const { data: products, ok } = await safeQuery("loading the products page", () => listProducts({ sort, q }), []);
  const qs = (s: string) => `/products?${new URLSearchParams({ ...(q ? { q } : {}), sort: s }).toString()}`;
  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="heading-spaced text-[15px] sm:text-base">{q ? "Search results" : "Products"}</h1>
          {q && <p className="mt-2 text-sm text-ink-muted">{products.length} result{products.length === 1 ? "" : "s"} for “{q}”</p>}
        </div>
        <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
          {SORTS.map((s) => (
            <Link key={s.key} href={qs(s.key)} className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] ${sort === s.key ? "border-rose/50 bg-crimson/40 text-ink" : "border-line text-ink-muted hover:text-ink"}`}>
              {s.label}
            </Link>
          ))}
        </div>
      </div>
      {!ok ? (
        <div className="card px-6 py-16 text-center">
          <p className="text-ink-soft">The store is temporarily unavailable.</p>
          <p className="mt-2 text-sm text-ink-muted">Please try again in a few minutes.</p>
        </div>
      ) : products.length ? (
        <ProductGrid products={products} />
      ) : (
        <div className="card px-6 py-16 text-center">
          <p className="text-ink-soft">No products found{q ? ` for “${q}”` : ""}.</p>
          {q && <Link href="/products" className="btn-outline btn-sm mt-4">View all products</Link>}
        </div>
      )}
    </div>
  );
}
