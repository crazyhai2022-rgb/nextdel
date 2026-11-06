"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";
import { track } from "@/lib/client";

/** Fires Purchase once per order (browser side; same event ID as server CAPI for dedup) and clears purchased items. */
export function PurchaseEffects(props: { orderNumber: string; eventId: string; value: number; currency: string; productIds: string[]; names: string }) {
  const cart = useCart();
  useEffect(() => {
    if (!cart.ready) return;
    const remaining = cart.items.filter((i) => !props.productIds.includes(i.productId));
    if (remaining.length !== cart.items.length) cart.replace(remaining);
    const key = `nd_purchase_${props.orderNumber}`;
    let fired = false;
    try {
      fired = localStorage.getItem(key) === "1";
    } catch {}
    if (!fired) {
      // Small delay so the pixel (if consented) has initialised.
      const t = setTimeout(() => {
        track("Purchase", { value: props.value / 100, currency: props.currency, content_ids: props.productIds, content_name: props.names, content_type: "product", num_items: props.productIds.length, order_id: props.orderNumber }, props.eventId);
        try {
          localStorage.setItem(key, "1");
        } catch {}
      }, 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready]);
  return null;
}
