"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch } from "./client";

export function NewAdminForm() {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const r = await adminFetch("/api/admin/users", "POST", Object.fromEntries(new FormData(form).entries()));
        setMsg({ ok: !!r.ok, text: r.ok ? "Admin created" : r.error || "Failed" });
        if (r.ok) { form.reset(); router.refresh(); }
      }}
    >
      <input name="name" required placeholder="Name" className="input h-9" />
      <input name="email" type="email" required placeholder="Email" className="input h-9" />
      <input name="password" type="password" required minLength={10} placeholder="Password (10+ chars, letters & numbers)" className="input h-9" autoComplete="new-password" />
      <select name="role" className="input h-9" defaultValue="SUPPORT"><option value="SUPPORT">Support</option><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super admin</option></select>
      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>}
      <button className="btn-primary btn-sm w-full">Create admin</button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const r = await adminFetch("/api/admin/users", "PUT", Object.fromEntries(new FormData(form).entries()));
        setMsg({ ok: !!r.ok, text: r.ok ? "Password changed. Other sessions were signed out." : r.error || "Failed" });
        if (r.ok) form.reset();
      }}
    >
      <input name="current" type="password" required placeholder="Current password" className="input h-9" autoComplete="current-password" />
      <input name="next" type="password" required minLength={10} placeholder="New password" className="input h-9" autoComplete="new-password" />
      {msg && <p className={`text-xs ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>}
      <button className="btn-outline btn-sm w-full">Change password</button>
    </form>
  );
}
