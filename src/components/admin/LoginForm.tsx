"use client";

import { useState } from "react";
import { adminFetch } from "./client";

export function LoginForm({ next, siteName }: { next: string; siteName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="w-full max-w-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        const r = await adminFetch("/api/admin/auth/login", "POST", { email: fd.get("email"), password: fd.get("password") });
        if (r.ok) window.location.href = next.startsWith("/admin") ? next : "/admin";
        else {
          setError(r.error || "Login failed");
          setBusy(false);
        }
      }}
    >
      <div className="mb-8 text-center">
        <div className="heading-spaced text-lg">{siteName}</div>
        <p className="mt-2 text-sm text-ink-muted">Admin sign in</p>
      </div>
      <div className="card space-y-4 p-6">
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required className="input" /></div>
        <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="input" /></div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? "Signing in…" : "Sign in"}</button>
      </div>
    </form>
  );
}
