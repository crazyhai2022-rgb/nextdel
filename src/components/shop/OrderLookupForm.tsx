"use client";

import { useState } from "react";
import { postJson } from "@/lib/client";

export function OrderLookupForm() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const r = await postJson<{ message?: string }>("/api/order-lookup", Object.fromEntries(fd.entries()));
    setMsg(r.ok ? { ok: true, text: r.message || "Done." } : { ok: false, text: r.error || "Something went wrong." });
    setBusy(false);
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label" htmlFor="l-email">Email address</label><input id="l-email" name="email" type="email" required className="input" /></div>
      <div><label className="label" htmlFor="l-order">Order ID (optional)</label><input id="l-order" name="orderNumber" placeholder="e.g. ND261106A1B2C3" className="input" /></div>
      {msg && <p className={`rounded-lg px-3 py-2.5 text-sm ${msg.ok ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border border-red-400/30 bg-red-400/10 text-red-200"}`}>{msg.text}</p>}
      <button disabled={busy} className="btn-primary w-full">{busy ? "Checking…" : "Resend my access email"}</button>
    </form>
  );
}
