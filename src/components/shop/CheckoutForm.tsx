"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "./CartProvider";
import { formatINR, getVisitorId, postJson, track } from "@/lib/client";
import { LockIcon, ShieldIcon } from "@/components/icons";

type Props = {
  gateway: { name: "RAZORPAY" | "CASHFREE"; mode: "TEST" | "LIVE" } | null;
  currency: string;
  secureNote: string;
  requireAge: boolean;
  ageText: string;
};

type CreateOrderResponse = {
  ok?: boolean;
  error?: string;
  code?: string;
  alreadyPaid?: boolean;
  token: string;
  orderNumber: string;
  amount: number;
  currency: string;
  razorpay?: { keyId: string; orderId: string; name: string; description: string; prefill: Record<string, string> };
  cashfree?: { paymentSessionId: string; mode: "sandbox" | "production" };
};

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (ev: string, cb: (r: { error?: { description?: string } }) => void) => void };
    Cashfree?: (opts: { mode: string }) => { checkout: (opts: Record<string, unknown>) => Promise<{ error?: { message?: string } }> };
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load the payment window. Check your connection and try again."));
    document.body.appendChild(s);
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GATEWAY_LABEL = { RAZORPAY: "Razorpay", CASHFREE: "Cashfree Payments" };

function newKey() {
  return (crypto.randomUUID?.() ?? `${Date.now()}${Math.random()}`).replace(/[^A-Za-z0-9]/g, "").slice(0, 40).padEnd(20, "0");
}

export function CheckoutForm({ gateway, currency, secureNote, requireAge, ageText }: Props) {
  const cart = useCart();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const idemKey = useRef<string>("");
  const pending = useRef<CreateOrderResponse | null>(null);
  const tracked = useRef(false);
  const detailsTracked = useRef("");

  // Re-price cart from the server.
  useEffect(() => {
    if (!cart.ready) return;
    if (!cart.items.length) {
      setItems([]);
      return;
    }
    postJson<{ items: CartItem[] }>("/api/cart/validate", { productIds: cart.items.map((i) => i.productId) }).then((r) => {
      const fresh = r.items ?? [];
      setItems(fresh);
      if (fresh.length !== cart.items.length) cart.replace(fresh);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.ready]);

  const total = useMemo(() => (items ?? []).reduce((s, i) => s + i.salePrice, 0), [items]);
  const original = useMemo(() => (items ?? []).reduce((s, i) => s + Math.max(i.originalPrice, i.salePrice), 0), [items]);
  const cartSig = (items ?? []).map((i) => i.productId).join(",");

  useEffect(() => {
    // New cart contents → new order on next submit.
    idemKey.current = newKey();
    pending.current = null;
  }, [cartSig]);

  useEffect(() => {
    if (!items?.length || tracked.current) return;
    tracked.current = true;
    track("InitiateCheckout", { content_ids: items.map((i) => i.productId), num_items: items.length, value: total / 100, currency });
    postJson("/api/checkout/track", { visitorId: getVisitorId(), stage: "CHECKOUT_STARTED", productIds: items.map((i) => i.productId) }).catch(() => {});
  }, [items, total, currency]);

  const onEmailBlur = () => {
    const e = email.trim().toLowerCase();
    if (!EMAIL_RE.test(e) || detailsTracked.current === e) return;
    detailsTracked.current = e;
    postJson("/api/checkout/track", { visitorId: getVisitorId(), stage: "DETAILS_ENTERED", email: e, ...(name.trim().length >= 2 ? { name: name.trim() } : {}), productIds: (items ?? []).map((i) => i.productId) }).catch(() => {});
  };

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Please enter your full name.";
    if (!EMAIL_RE.test(email.trim())) e.email = "Please enter a valid email address.";
    if (requireAge && !age) e.age = "Please confirm to continue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function openRazorpay(order: CreateOrderResponse) {
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!window.Razorpay || !order.razorpay) throw new Error("Payment window unavailable");
    const brand = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim().split(" ").map(Number);
    const color = brand.length === 3 ? `#${brand.map((n) => n.toString(16).padStart(2, "0")).join("")}` : "#6B1E23";
    const rzp = new window.Razorpay({
      key: order.razorpay.keyId,
      order_id: order.razorpay.orderId,
      amount: order.amount,
      currency: order.currency,
      name: order.razorpay.name,
      description: order.razorpay.description,
      prefill: order.razorpay.prefill,
      notes: { order_number: order.orderNumber },
      theme: { color },
      handler: async (resp: Record<string, string>) => {
        setBusy(true);
        setMessage({ tone: "info", text: "Verifying your payment…" });
        const r = await postJson<{ status?: string }>("/api/payments/razorpay/verify", { token: order.token, ...resp }).catch(() => null);
        router.push(r?.status === "PAID" ? `/payment/success/${order.token}` : `/payment/processing?token=${order.token}`);
      },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setMessage({ tone: "info", text: "Payment window closed. Your order is saved — click Pay to try again." });
          postJson("/api/checkout/track", { visitorId: getVisitorId(), stage: "PAYMENT_WINDOW_CLOSED", token: order.token }).catch(() => {});
        },
      },
    });
    rzp.on("payment.failed", (r) => {
      setMessage({ tone: "error", text: r.error?.description ? `Payment failed: ${r.error.description}. You can try again.` : "Payment failed. You can try again." });
    });
    rzp.open();
  }

  async function openCashfree(order: CreateOrderResponse) {
    await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");
    if (!window.Cashfree || !order.cashfree?.paymentSessionId) throw new Error("Payment window unavailable");
    const cf = window.Cashfree({ mode: order.cashfree.mode });
    const r = await cf.checkout({ paymentSessionId: order.cashfree.paymentSessionId, redirectTarget: "_self" });
    if (r?.error) throw new Error(r.error.message || "Payment could not be started");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !gateway || !items?.length) return;
    setMessage(null);
    if (!validate()) return;
    setBusy(true);
    try {
      let order = pending.current;
      if (!order) {
        track("AddPaymentInfo", { content_ids: items.map((i) => i.productId), value: total / 100, currency });
        const r = await postJson<CreateOrderResponse>("/api/checkout/create-order", {
          productIds: items.map((i) => i.productId),
          name: name.trim(),
          email: email.trim(),
          visitorId: getVisitorId(),
          idempotencyKey: idemKey.current,
          ageConfirmed: age,
        });
        if (!r.ok) {
          // A failed attempt leaves its order behind; use a fresh key so "Pay" can be retried.
          idemKey.current = newKey();
          pending.current = null;
          if (r.code === "CART_CHANGED") cart.replace([]);
          throw new Error(r.error || "Could not create your order.");
        }
        if (r.alreadyPaid) {
          router.push(`/payment/success/${r.token}`);
          return;
        }
        order = r;
        pending.current = r;
      }
      if (gateway.name === "RAZORPAY") await openRazorpay(order);
      else await openCashfree(order);
    } catch (err) {
      setMessage({ tone: "error", text: err instanceof Error ? err.message : "Something went wrong." });
      setBusy(false);
    }
  }

  if (!cart.ready || items === null) return <div className="h-64 animate-pulse rounded-2xl bg-surface/60" />;
  if (!items.length) {
    return (
      <div className="card px-6 py-16 text-center">
        <p className="text-ink-soft">Your cart is empty.</p>
        <Link href="/products" className="btn-primary mt-5">Browse products</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <section className="card p-5 sm:p-6">
          <h2 className="heading-spaced mb-5 text-[12px]">Your details</h2>
          <div className="grid gap-4">
            <div>
              <label htmlFor="name" className="label">Full name</label>
              <input id="name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} maxLength={120} />
              {errors.name && <p className="mt-1 text-sm text-red-300">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" type="email" inputMode="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={onEmailBlur} aria-invalid={!!errors.email} maxLength={191} />
              {errors.email ? <p className="mt-1 text-sm text-red-300">{errors.email}</p> : <p className="mt-1 text-xs text-ink-muted">Your product and receipt will be sent here.</p>}
            </div>
            {requireAge && (
              <label className="flex items-start gap-2.5 text-sm text-ink-soft">
                <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#6B1E23]" />
                <span>{ageText}</span>
              </label>
            )}
            {errors.age && <p className="-mt-2 text-sm text-red-300">{errors.age}</p>}
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="heading-spaced mb-4 text-[12px]">Payment method</h2>
          {gateway ? (
            <div className="flex items-center justify-between rounded-xl border border-rose/40 bg-crimson/25 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-rose"><span className="h-2 w-2 rounded-full bg-rose" /></span>
                <div>
                  <div className="text-[15px] font-medium text-ink">{GATEWAY_LABEL[gateway.name]}</div>
                  <div className="text-xs text-ink-muted">UPI, cards, net banking & wallets</div>
                </div>
              </div>
              {gateway.mode === "TEST" && <span className="rounded-full border border-amber-400/40 px-2 py-0.5 text-[11px] text-amber-200">Test mode</span>}
            </div>
          ) : (
            <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">Online payments are temporarily unavailable. Please try again later.</p>
          )}
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink-muted"><LockIcon size={15} className="mt-0.5 shrink-0" /> {secureNote}</p>
        </section>
      </div>

      <aside className="card h-fit p-5 lg:sticky lg:top-20">
        <h2 className="heading-spaced mb-4 text-[12px]">Order summary</h2>
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-3">
              <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-md bg-surface">
                {i.thumbnailUrl && <Image src={i.thumbnailUrl} alt="" fill sizes="80px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="line-clamp-2 text-ink">{i.title}</span>
                <span className="text-ink-muted">{formatINR(i.salePrice, currency)}</span>
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between text-ink-soft"><dt>Subtotal</dt><dd>{formatINR(original, currency)}</dd></div>
          {original > total && <div className="flex justify-between" style={{ color: "var(--accent-label)" }}><dt>Discount</dt><dd>−{formatINR(original - total, currency)}</dd></div>}
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold text-ink"><dt>Total payable</dt><dd>{formatINR(total, currency)}</dd></div>
        </dl>
        {message && (
          <p className={`mt-4 rounded-lg px-3 py-2.5 text-sm ${message.tone === "error" ? "border border-red-400/30 bg-red-400/10 text-red-200" : "border border-line bg-white/5 text-ink-soft"}`} role="status">
            {message.text}
          </p>
        )}
        <button type="submit" disabled={busy || !gateway} className="btn-primary mt-5 h-12 w-full">
          {busy ? "Please wait…" : `Pay ${formatINR(total, currency)}`}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-muted"><ShieldIcon size={14} /> Instant delivery after verified payment</p>
      </aside>
    </form>
  );
}
