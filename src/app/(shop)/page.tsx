import { getSetting } from "@/lib/settings";
import { listProducts, type SortKey } from "@/lib/products";
import { ProductGrid } from "@/components/shop/ProductCard";

export default async function HomePage() {
  const home = await getSetting("homepage");
  const products = await listProducts({ sort: home.sort as SortKey });
  return (
    <div className="container-site py-10 sm:py-14">
      {home.showIntro && home.subheading && <p className="mb-6 max-w-2xl text-[15px] leading-7 text-ink-soft">{home.subheading}</p>}
      <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-4">
        <h1 className="heading-spaced text-[15px] sm:text-base">{home.heading || "All Products"}</h1>
        <span className="text-sm text-ink-muted">{products.length} product{products.length === 1 ? "" : "s"}</span>
      </div>
      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <div className="card px-6 py-16 text-center text-ink-muted">New products are coming soon.</div>
      )}
    </div>
  );
}
