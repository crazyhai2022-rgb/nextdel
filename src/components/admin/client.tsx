"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export async function adminFetch<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T & { ok?: boolean; error?: string }> {
  const res = await fetch(url, {
    method,
    headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) window.location.href = "/admin/login";
  if (!res.ok && !data.error) data.error = `Request failed (${res.status})`;
  return data;
}

/** A button that performs an admin API action, with confirm, loading and result message. */
export function ActionButton({
  url,
  method = "POST",
  body,
  label,
  confirm,
  className = "btn-outline btn-sm",
  onDone,
  redirect,
}: {
  url: string;
  method?: string;
  body?: unknown;
  label: string;
  confirm?: string;
  className?: string;
  onDone?: (data: Record<string, unknown>) => void;
  redirect?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        className={className}
        onClick={async () => {
          if (confirm && !window.confirm(confirm)) return;
          setBusy(true);
          setMsg(null);
          const r = await adminFetch(url, method, body);
          setBusy(false);
          setMsg({ ok: !!r.ok, text: r.ok ? String(r.message ?? "Done") : String(r.error) });
          if (r.ok) {
            onDone?.(r);
            if (redirect) router.push(redirect);
            else router.refresh();
          }
        }}
      >
        {busy ? "Working…" : label}
      </button>
      {msg && <span className={`text-xs ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</span>}
    </span>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-1">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition ${checked ? "border-rose/60 bg-crimson" : "border-line bg-black/30"}`}
      >
        <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function SaveBar({ busy, msg, label = "Save changes" }: { busy: boolean; msg: { ok: boolean; text: string } | null; label?: string }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-line bg-night/90 px-4 py-3 backdrop-blur">
      {msg && <span className={`text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</span>}
      <button type="submit" disabled={busy} className="btn-primary btn-sm">{busy ? "Saving…" : label}</button>
    </div>
  );
}

/** Uploads a file to /api/admin/upload. Returns {url} for public or {key,...} for private. */
export function UploadButton({
  visibility = "public",
  accept,
  label = "Upload",
  onUploaded,
  className = "btn-outline btn-sm",
  multiple = false,
}: {
  visibility?: "public" | "private";
  accept: string;
  label?: string;
  onUploaded: (f: { url: string | null; key: string; mime: string; size: number; originalName: string }) => void;
  className?: string;
  multiple?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <span className="inline-flex flex-col gap-1">
      <label className={`${className} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy ? "Uploading…" : label}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (!files.length) return;
            setBusy(true);
            setErr("");
            for (const file of files) {
              const fd = new FormData();
              fd.append("file", file);
              fd.append("visibility", visibility);
              const r = await adminFetch<{ file: { url: string | null; key: string; mime: string; size: number; originalName: string } }>("/api/admin/upload", "POST", fd);
              if (r.ok && r.file) onUploaded(r.file);
              else setErr(r.error || "Upload failed");
            }
            setBusy(false);
          }}
        />
      </label>
      {err && <span className="text-xs text-red-300">{err}</span>}
    </span>
  );
}
