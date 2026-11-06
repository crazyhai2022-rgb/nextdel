"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "./client";

export function EmailComposer({ to, orderId, checkoutId, inquiryId, defaultSubject = "", defaultMessage = "", lockTo = true }: { to?: string; orderId?: string; checkoutId?: string; inquiryId?: string; defaultSubject?: string; defaultMessage?: string; lockTo?: boolean }) {
  const router = useRouter();
  const [recipient, setRecipient] = useState(to ?? "");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        const r = await adminFetch("/api/admin/emails/send", "POST", { to: recipient, subject, message, orderId, checkoutId, inquiryId });
        setBusy(false);
        setMsg({ ok: !!r.ok, text: r.ok ? "Accepted by mail server." : r.error || "Failed" });
        if (r.ok) {
          setMessage("");
          router.refresh();
        }
      }}
    >
      <input className="input h-9" type="email" required value={recipient} onChange={(e) => setRecipient(e.target.value)} readOnly={lockTo && !!to} placeholder="customer@email.com" aria-label="To" />
      <input className="input h-9" required maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" aria-label="Subject" />
      <textarea className="input" required rows={6} maxLength={10000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message… (links are clickable)" aria-label="Message" />
      <div className="flex items-center justify-between gap-2">
        {msg ? <span className={`text-xs ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</span> : <span />}
        <button disabled={busy} className="btn-primary btn-sm">{busy ? "Sending…" : "Send email"}</button>
      </div>
    </form>
  );
}
