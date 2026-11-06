"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getVisitorId } from "@/lib/client";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  salePrice: number;
  originalPrice: number;
};

type Ctx = {
  items: CartItem[];
  ready: boolean;
  count: number;
  add: (item: CartItem) => boolean;
  remove: (productId: string) => void;
  replace: (items: CartItem[]) => void;
  clear: () => void;
  has: (productId: string) => boolean;
  toast: (msg: string, action?: { label: string; href: string }) => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "nd_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [toastState, setToast] = useState<{ msg: string; action?: { label: string; href: string }; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.filter((i) => i && typeof i.productId === "string").slice(0, 50));
      }
    } catch {}
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        try {
          setItems(JSON.parse(e.newValue || "[]"));
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, ready]);

  const toast = useCallback((msg: string, action?: { label: string; href: string }) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ msg, action, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;

  const add = useCallback((item: CartItem) => {
    const prev = itemsRef.current;
    if (prev.some((p) => p.productId === item.productId)) return false;
    const next = [...prev, item];
    itemsRef.current = next;
    setItems(next);
    fetch("/api/checkout/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId(), stage: "CART", productIds: next.map((i) => i.productId) }),
      keepalive: true,
    }).catch(() => {});
    return true;
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      items,
      ready,
      count: items.length,
      add,
      remove: (id) => setItems((prev) => prev.filter((p) => p.productId !== id)),
      replace: (next) => setItems(next),
      clear: () => setItems([]),
      has: (id) => items.some((p) => p.productId === id),
      toast,
    }),
    [items, ready, add, toast],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
        {toastState && (
          <div key={toastState.id} className="pointer-events-auto flex items-center gap-4 rounded-full border border-white/15 bg-surface-2 px-5 py-3 text-sm text-ink shadow-velvet">
            <span>{toastState.msg}</span>
            {toastState.action && (
              <a href={toastState.action.href} className="font-semibold text-rose underline underline-offset-2">
                {toastState.action.label}
              </a>
            )}
          </div>
        )}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
