"use client";

import { useState } from "react";
import { adminFetch } from "./client";

export function SetupForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="card w-full max-w-md space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const fd = new FormData(e.currentTarget);
        const r = await adminFetch("/api/admin/setup", "POST", Object.fromEntries(fd.entries()));
        if (r.ok) window.location.href = "/admin";
        else {
          setError(r.error || "Setup failed");
          setBusy(false);
        }
      }}
    >
      <h1 className="text-lg font-semibold text-ink">Create the first admin</h1>
      <p className="text-sm text-ink-muted">Enter the ADMIN_SETUP_TOKEN from your environment. After this, remove the token from your environment variables.</p>
      <div><label className="label">Setup token</label><input name="token" type="password" required className="input" /></div>
      <div><label className="label">Name</label><input name="name" required className="input" /></div>
      <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
      <div><label className="label">Password (min 10 chars, letters + numbers)</label><input name="password" type="password" required minLength={10} className="input" /></div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">{busy ? "Creating…" : "Create admin"}</button>
    </form>
  );
}
