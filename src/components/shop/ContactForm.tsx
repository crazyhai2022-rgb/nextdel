"use client";

import { useState } from "react";
import { postJson } from "@/lib/client";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError("");
    setState("busy");
    const r = await postJson("/api/contact", Object.fromEntries(fd.entries()));
    if (r.ok) setState("done");
    else {
      setError(r.error || "Could not send your message.");
      setState("idle");
    }
  }
  if (state === "done") return <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Thanks — your message has been received. We'll reply by email soon.</p>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" name="name" required minLength={2} maxLength={120} className="input" /></div>
        <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" required maxLength={191} className="input" /></div>
      </div>
      <div><label className="label" htmlFor="c-order">Order ID (optional)</label><input id="c-order" name="orderNumber" maxLength={32} className="input" /></div>
      <div><label className="label" htmlFor="c-subject">Subject</label><input id="c-subject" name="subject" maxLength={200} className="input" /></div>
      <div><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" name="message" required minLength={10} maxLength={5000} rows={5} className="input" /></div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button disabled={state === "busy"} className="btn-primary w-full">{state === "busy" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
