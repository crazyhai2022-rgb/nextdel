"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch, Field, SaveBar, Toggle } from "./client";
import { RichTextEditor } from "./RichTextEditor";

type V = { title: string; content: string; seoTitle: string; seoDescription: string; published: boolean };

export function PageForm({ slug, initial }: { slug: string; initial: V }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await adminFetch(`/api/admin/pages/${slug}`, "PUT", v);
        setBusy(false);
        setMsg({ ok: !!r.ok, text: r.ok ? "Saved — live on the site now." : r.error || "Failed" });
        if (r.ok) router.refresh();
      }}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-xl border border-line bg-surface/60 p-5">
          <Field label="Title"><input className="input" required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></Field>
          <Field label="Content"><RichTextEditor value={v.content} onChange={(c) => setV({ ...v, content: c })} minHeight={420} /></Field>
        </div>
        <div className="h-fit space-y-4 rounded-xl border border-line bg-surface/60 p-5">
          <Toggle checked={v.published} onChange={(p) => setV({ ...v, published: p })} label="Published" hint="Unpublished pages return 404." />
          <Field label="SEO title"><input className="input" value={v.seoTitle} onChange={(e) => setV({ ...v, seoTitle: e.target.value })} /></Field>
          <Field label="SEO description"><textarea className="input" rows={3} value={v.seoDescription} onChange={(e) => setV({ ...v, seoDescription: e.target.value })} /></Field>
        </div>
      </div>
      <SaveBar busy={busy} msg={msg} />
    </form>
  );
}
