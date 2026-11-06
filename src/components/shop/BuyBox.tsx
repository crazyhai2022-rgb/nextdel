"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "./CartProvider";
import { track } from "@/lib/client";
import { CartIcon, SocialIcon } from "@/components/icons";

type Props = { item: CartItem; demo: { url: string; label: string } | null; currency: string };

export function BuyBox({ item, demo, currency }: Props) {
  const cart = useCart();
  const router = useRouter();
  const inCart = cart.ready && cart.has(item.productId);
  const pixelParams = { content_ids: [item.productId], content_name: item.title, content_type: "product", value: item.salePrice / 100, currency };

  useEffect(() => {
    track("ViewContent", pixelParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.productId]);

  const addToCart = () => {
    const added = cart.add(item);
    if (added) track("AddToCart", pixelParams);
    cart.toast(added ? "Added to cart" : "Already in your cart", { label: "View cart", href: "/cart" });
  };

  const buyNow = () => {
    if (cart.add(item)) track("AddToCart", pixelParams);
    router.push("/checkout");
  };

  return (
    <div className="space-y-2.5">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <button onClick={buyNow} className="btn-primary h-12 w-full">Buy Now</button>
        {inCart ? (
          <button onClick={() => router.push("/cart")} className="btn-outline h-12 w-full"><CartIcon size={18} /> View Cart</button>
        ) : (
          <button onClick={addToCart} className="btn-outline h-12 w-full"><CartIcon size={18} /> Add to Cart</button>
        )}
      </div>
      {demo && (
        <a href={demo.url} target="_blank" rel="noopener noreferrer" className="btn h-12 w-full border border-[#2AABEE]/40 bg-[#2AABEE]/10 text-[#9fd8f5] hover:bg-[#2AABEE]/20">
          <SocialIcon platform="telegram" /> {demo.label}
        </a>
      )}
    </div>
  );
}
