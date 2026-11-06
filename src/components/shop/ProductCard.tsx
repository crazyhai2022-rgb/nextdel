import Link from "next/link";
import Image from "next/image";
import type { ProductCardData } from "@/lib/products";
import { InfinityIcon } from "@/components/icons";
import { Price } from "./Price";

export function ProductCard({ p, priority = false }: { p: ProductCardData; priority?: boolean }) {
  return (
    <Link href={`/product/${p.slug}`} className="group block focus-visible:outline-none">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-surface ring-1 ring-inset ring-white/10">
        {p.thumbnailUrl ? (
          <Image
            src={p.thumbnailUrl}
            alt={p.thumbnailAlt || p.title}
            fill
            sizes="(min-width:1200px) 380px, (min-width:640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">{p.title}</div>
        )}
      </div>
      <div className="pt-3">
        <h3 className="line-clamp-2 text-[15.5px] font-semibold leading-snug text-ink group-hover:underline group-hover:underline-offset-2">{p.title}</h3>
        <div className="mt-1.5">
          <Price sale={p.salePrice} original={p.originalPrice} size="sm" />
        </div>
        {p.lifetimeLabel && (
          <span className="lifetime mt-1.5"><InfinityIcon size={14} /> {p.lifetimeLabel}</span>
        )}
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, i) => (
        <ProductCard key={p.id} p={p} priority={i < 3} />
      ))}
    </div>
  );
}
