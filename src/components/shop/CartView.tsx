"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart, type CartItem } from "./CartProvider";
import { formatINR, postJson } from "@/lib/client";
import { TrashIcon, LockIcon, InfinityIcon } from "@/components/icons";

export function CartView() {
  const cart = useCart();
  const [validated, setValidated] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!cart.ready || validated) return;
    if (!cart.items.length) {
      setValidated(true);
      return;
    }
    postJson<{ items: CartItem[]; removed: number }>("/api/cart/validate", { productIds: cart.items.map((i) => i.productId) })
      .then((r) => {
        if (r.items) {
          cart.replace(r.items);
          if (r.removed > 0) setNotice(`${r.removed} item${r.removed > 1 ? "s were" : " was"} removed because ${r.removed > 1 ? "they are" : "it is"} no longer available.`);
        }
      })
      .finally(() => setValidated(true));
  }, [cart, validated]);

  if (!cart.ready || !validated) return <div className="h-40 animate-pulse rounded-2xl bg-surface/60" />;

  if (!cart.items.length) {
    return (
      <div className="card px-6 py-16 text-center">
        <p className="text-ink-soft">Your cart is empty.</p>
        <Link href="/products" className="btn-primary mt-5">Browse products</Link>
      </div>
    );
  }

  const total = cart.items.reduce((s, i) => s + i.salePrice, 0);
  const original = cart.items.reduce((s, i) => s + Math.max(i.originalPrice, i.salePrice), 0);
  const savings = original - total;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        {notice && <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{notice}</p>}
        <ul className="divide-y divide-line rounded-2xl border border-line bg-surface/40">
          {cart.items.map((i) => (
            <li key={i.productId} className="flex gap-4 p-4">
              <Link href={`/product/${i.slug}`} className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-surface sm:w-40">
                {i.thumbnailUrl && <Image src={i.thumbnailUrl} alt={i.title} fill sizes="160px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/product/${i.slug}`} className="line-clamp-2 text-[15px] font-medium text-ink hover:underline">{i.title}</Link>
                <span className="lifetime mt-1"><InfinityIcon size={14} /> Lifetime access</span>
                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-ink">{formatINR(i.salePrice)}</span>
                    {i.originalPrice > i.salePrice && <span className="text-sm text-ink-muted line-through">{formatINR(i.originalPrice)}</span>}
                  </div>
                  <button onClick={() => cart.remove(i.productId)} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-rose" aria-label={`Remove ${i.title}`}>
                    <TrashIcon size={16} /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/products" className="mt-4 inline-block text-sm text-ink-muted hover:text-ink">← Continue shopping</Link>
      </div>

      <aside className="card h-fit p-5 lg:sticky lg:top-20">
        <h2 className="heading-spaced mb-4 text-[12px]">Order summary</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-ink-soft"><dt>Items ({cart.items.length})</dt><dd>{formatINR(original)}</dd></div>
          {savings > 0 && <div className="flex justify-between" style={{ color: "var(--accent-label)" }}><dt>Discount</dt><dd>−{formatINR(savings)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink"><dt>Total</dt><dd>{formatINR(total)}</dd></div>
        </dl>
        <Link href="/checkout" className="btn-primary mt-5 h-12 w-full">Proceed to Checkout</Link>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted"><LockIcon size={14} /> Secure checkout</p>
      </aside>
    </div>
  );
}
