"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetch, Field, SaveBar, Toggle, UploadButton } from "./client";
import { RichTextEditor } from "./RichTextEditor";
import { TrashIcon } from "@/components/icons";

export type ProductFormValue = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  overview: string;
  accessInstructions: string;
  originalPrice: number | string;
  salePrice: number | string;
  lifetimeLabel: string;
  accessInfo: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  bannerUrl: string;
  status: "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
  featured: boolean;
  visible: boolean;
  sortOrder: number;
  demoEnabled: boolean;
  demoLinkType: "GROUP" | "CHANNEL" | "INVITE";
  demoGroupUrl: string;
  demoChannelUrl: string;
  demoInviteUrl: string;
  demoButtonText: string;
  relatedMode: "AUTO" | "MANUAL";
  relatedIds: string[];
  seoTitle: string;
  seoDescription: string;
  images: { url: string; alt: string; kind: "GALLERY" | "PREVIEW" | "CONTENT" }[];
  videos: { kind: "EMBED" | "UPLOAD"; url: string; title: string; posterUrl: string; isPreview: boolean }[];
  features: { type: "FEATURE" | "BENEFIT" | "INCLUDED" | "OUTCOME"; text: string }[];
  faqs: { question: string; answer: string }[];
  downloads: { id?: string; storageKey: string; fileName: string; mimeType: string; size: number }[];
  accessLinks: { label: string; url: string }[];
};

export const EMPTY_PRODUCT: ProductFormValue = {
  title: "", slug: "", shortDescription: "", description: "", overview: "", accessInstructions: "",
  originalPrice: "", salePrice: "", lifetimeLabel: "Lifetime Access", accessInfo: "",
  thumbnailUrl: "", thumbnailAlt: "", bannerUrl: "", status: "DRAFT", featured: false, visible: true, sortOrder: 0,
  demoEnabled: false, demoLinkType: "GROUP", demoGroupUrl: "", demoChannelUrl: "", demoInviteUrl: "", demoButtonText: "Join Free Demo",
  relatedMode: "AUTO", relatedIds: [], seoTitle: "", seoDescription: "",
  images: [], videos: [], features: [], faqs: [], downloads: [], accessLinks: [],
};

function move<T>(arr: T[], from: number, to: number) {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

/** Reorderable list with drag-and-drop and arrow buttons. */
function Sortable<T>({ items, onChange, render }: { items: T[]; onChange: (v: T[]) => void; render: (item: T, i: number, update: (patch: Partial<T>) => void) => React.ReactNode }) {
  const [drag, setDrag] = useState<number | null>(null);
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li
          key={i}
          draggable
          onDragStart={() => setDrag(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (drag !== null && drag !== i) onChange(move(items, drag, i)); setDrag(null); }}
          className={`flex gap-2 rounded-lg border border-line bg-black/20 p-2.5 ${drag === i ? "opacity-50" : ""}`}
        >
          <div className="flex flex-col items-center gap-0.5 pt-1 text-ink-muted">
            <span className="cursor-grab select-none text-xs" title="Drag to reorder">⋮⋮</span>
            <button type="button" onClick={() => onChange(move(items, i, i - 1))} className="text-[10px] hover:text-ink" aria-label="Move up">▲</button>
            <button type="button" onClick={() => onChange(move(items, i, i + 1))} className="text-[10px] hover:text-ink" aria-label="Move down">▼</button>
          </div>
          <div className="min-w-0 flex-1">{render(item, i, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))))}</div>
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="self-start p-1 text-ink-muted hover:text-red-300" aria-label="Remove"><TrashIcon size={16} /></button>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface/60">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function ImagePicker({ label, value, onChange, hint, aspect = "aspect-video" }: { label: string; value: string; onChange: (v: string) => void; hint?: string; aspect?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-start gap-3">
        <div className={`relative ${aspect} w-40 shrink-0 overflow-hidden rounded-lg border border-line bg-black/30`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value && <img src={value} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex flex-col gap-2">
          <UploadButton accept="image/jpeg,image/png,image/webp,image/gif" label={value ? "Replace" : "Upload image"} onUploaded={(f) => onChange(f.url ?? "")} />
          {value && <button type="button" onClick={() => onChange("")} className="text-left text-xs text-ink-muted hover:text-red-300">Remove</button>}
        </div>
      </div>
    </Field>
  );
}

const FEATURE_TYPES = [
  { key: "FEATURE", label: "Key features" },
  { key: "INCLUDED", label: "What's included" },
  { key: "OUTCOME", label: "Highlights" },
  { key: "BENEFIT", label: "Benefits" },
] as const;

export function ProductForm({ id, initial, allProducts }: { id?: string; initial: ProductFormValue; allProducts: { id: string; title: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValue>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof ProductFormValue>(k: K, val: ProductFormValue[K]) => setV((p) => ({ ...p, [k]: val }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await adminFetch<{ id?: string }>(id ? `/api/admin/products/${id}` : "/api/admin/products", id ? "PUT" : "POST", v);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error || "Save failed" });
    setMsg({ ok: true, text: "Saved" });
    if (!id && r.id) router.replace(`/admin/products/${r.id}?created=1`);
    else router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Section title="Basics">
            <Field label="Product title"><input className="input" required value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={200} /></Field>
            <Field label="URL slug" hint={`Leave empty to generate from the title. URL: /product/${v.slug || "…"}`}><input className="input" value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} maxLength={191} /></Field>
            <Field label="Short description" hint="Shown under the title on the product page."><textarea className="input" rows={3} value={v.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} maxLength={2000} /></Field>
          </Section>

          <Section title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Original price (₹)" hint="Shown with strikethrough."><input className="input" type="number" min={0} step="0.01" value={v.originalPrice} onChange={(e) => set("originalPrice", e.target.value)} /></Field>
              <Field label="Discounted price (₹)" hint="The price customers pay."><input className="input" type="number" min={1} step="0.01" required value={v.salePrice} onChange={(e) => set("salePrice", e.target.value)} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Lifetime access label"><input className="input" value={v.lifetimeLabel} onChange={(e) => set("lifetimeLabel", e.target.value)} maxLength={60} /></Field>
              <Field label="Access information" hint="e.g. 'PDF + private access portal'"><input className="input" value={v.accessInfo} onChange={(e) => set("accessInfo", e.target.value)} maxLength={200} /></Field>
            </div>
          </Section>

          <Section title="Media" description="Thumbnail must be 16:9 (e.g. 1280×720). Images up to 10 MB.">
            <div className="grid gap-5 md:grid-cols-2">
              <ImagePicker label="Main thumbnail (16:9)" value={v.thumbnailUrl} onChange={(x) => set("thumbnailUrl", x)} />
              <ImagePicker label="Product banner (optional)" value={v.bannerUrl} onChange={(x) => set("bannerUrl", x)} hint="Shown large on the product page instead of the thumbnail." />
            </div>
            <Field label="Thumbnail alt text"><input className="input" value={v.thumbnailAlt} onChange={(e) => set("thumbnailAlt", e.target.value)} maxLength={200} /></Field>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">Gallery & preview images</span>
                <UploadButton multiple accept="image/jpeg,image/png,image/webp,image/gif" label="Add images" onUploaded={(f) => setV((p) => ({ ...p, images: [...p.images, { url: f.url ?? "", alt: "", kind: "GALLERY" }] }))} />
              </div>
              <Sortable items={v.images} onChange={(x) => set("images", x)} render={(img, _i, up) => (
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="aspect-video w-28 rounded border border-line object-cover" />
                  <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_170px]">
                    <input className="input h-9" placeholder="Alt text" value={img.alt} onChange={(e) => up({ alt: e.target.value })} />
                    <select className="input h-9" value={img.kind} onChange={(e) => up({ kind: e.target.value as typeof img.kind })}>
                      <option value="GALLERY">Top gallery</option><option value="PREVIEW">Preview (gallery)</option><option value="CONTENT">In description area</option>
                    </select>
                  </div>
                </div>
              )} />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="label mb-0">Videos</span>
                <div className="flex gap-2">
                  <button type="button" className="btn-outline btn-sm" onClick={() => setV((p) => ({ ...p, videos: [...p.videos, { kind: "EMBED", url: "", title: "", posterUrl: "", isPreview: true }] }))}>Add YouTube/Vimeo</button>
                  <UploadButton accept="video/mp4,video/webm" label="Upload MP4" onUploaded={(f) => setV((p) => ({ ...p, videos: [...p.videos, { kind: "UPLOAD", url: f.url ?? "", title: f.originalName, posterUrl: "", isPreview: true }] }))} />
                </div>
              </div>
              <Sortable items={v.videos} onChange={(x) => set("videos", x)} render={(vid, _i, up) => (
                <div className="grid gap-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className="input h-9" placeholder={vid.kind === "EMBED" ? "https://youtube.com/watch?v=…" : "Uploaded file"} value={vid.url} readOnly={vid.kind === "UPLOAD"} onChange={(e) => up({ url: e.target.value })} />
                    <input className="input h-9" placeholder="Title (optional)" value={vid.title} onChange={(e) => up({ title: e.target.value })} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-ink-soft">
                    <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-[#6B1E23]" checked={vid.isPreview} onChange={(e) => up({ isPreview: e.target.checked })} /> Show in top media gallery</label>
                    <UploadButton accept="image/jpeg,image/png,image/webp" label={vid.posterUrl ? "Replace poster" : "Poster image"} className="text-xs text-rose" onUploaded={(f) => up({ posterUrl: f.url ?? "" })} />
                  </div>
                </div>
              )} />
            </div>
          </Section>

          <Section title="Description">
            <Field label="Product overview"><RichTextEditor value={v.overview} onChange={(x) => set("overview", x)} minHeight={120} placeholder="A short overview…" /></Field>
            <Field label="Full description"><RichTextEditor value={v.description} onChange={(x) => set("description", x)} minHeight={260} placeholder="Describe the product in detail…" /></Field>
          </Section>

          <Section title="Features, inclusions & outcomes" description="Each list appears as its own block on the product page. Leave a list empty to hide it.">
            {FEATURE_TYPES.map((t) => {
              const list = v.features.map((f, idx) => ({ ...f, idx })).filter((f) => f.type === t.key);
              return (
                <div key={t.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="label mb-0">{t.label}</span>
                    <button type="button" className="text-xs text-rose" onClick={() => setV((p) => ({ ...p, features: [...p.features, { type: t.key, text: "" }] }))}>+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {list.map((f) => (
                      <div key={f.idx} className="flex gap-2">
                        <input className="input h-9" value={f.text} onChange={(e) => setV((p) => ({ ...p, features: p.features.map((x, j) => (j === f.idx ? { ...x, text: e.target.value } : x)) }))} maxLength={500} />
                        <button type="button" className="px-2 text-ink-muted hover:text-red-300" onClick={() => setV((p) => ({ ...p, features: p.features.filter((_, j) => j !== f.idx) }))} aria-label="Remove"><TrashIcon size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </Section>

          <Section title="Frequently asked questions">
            <Sortable items={v.faqs} onChange={(x) => set("faqs", x)} render={(f, _i, up) => (
              <div className="grid gap-2">
                <input className="input h-9" placeholder="Question" value={f.question} onChange={(e) => up({ question: e.target.value })} maxLength={300} />
                <textarea className="input" rows={2} placeholder="Answer" value={f.answer} onChange={(e) => up({ answer: e.target.value })} maxLength={5000} />
              </div>
            )} />
            <button type="button" className="btn-outline btn-sm" onClick={() => set("faqs", [...v.faqs, { question: "", answer: "" }])}>Add FAQ</button>
          </Section>

          <Section title="Digital delivery" description="Delivered only after verified payment. Files are stored privately and served via signed, time-limited links.">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">Downloadable files (PDF / ZIP)</span>
                <UploadButton visibility="private" accept="application/pdf,application/zip,.zip" label="Upload file" onUploaded={(f) => setV((p) => ({ ...p, downloads: [...p.downloads, { storageKey: f.key, fileName: f.originalName, mimeType: f.mime, size: f.size }] }))} />
              </div>
              <Sortable items={v.downloads} onChange={(x) => set("downloads", x)} render={(d, _i, up) => (
                <div className="flex items-center gap-3">
                  <input className="input h-9" value={d.fileName} onChange={(e) => up({ fileName: e.target.value })} aria-label="File name shown to customer" />
                  <span className="shrink-0 text-xs text-ink-muted">{(d.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              )} />
              {!v.downloads.length && <p className="text-xs text-ink-muted">No files. Products can be link-only.</p>}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">External access links</span>
                <button type="button" className="text-xs text-rose" onClick={() => set("accessLinks", [...v.accessLinks, { label: "Access your product", url: "" }])}>+ Add link</button>
              </div>
              <Sortable items={v.accessLinks} onChange={(x) => set("accessLinks", x)} render={(l, _i, up) => (
                <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
                  <input className="input h-9" placeholder="Button label" value={l.label} onChange={(e) => up({ label: e.target.value })} maxLength={120} />
                  <input className="input h-9" placeholder="https://…" value={l.url} onChange={(e) => up({ url: e.target.value })} maxLength={1000} />
                </div>
              )} />
            </div>
            <Field label="Access instructions (shown after purchase & on product page)"><RichTextEditor value={v.accessInstructions} onChange={(x) => set("accessInstructions", x)} minHeight={100} /></Field>
          </Section>

          <Section title="Telegram free demo">
            <Toggle checked={v.demoEnabled} onChange={(x) => set("demoEnabled", x)} label="Show “Join Free Demo” button" hint="Hidden automatically when disabled." />
            {v.demoEnabled && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Telegram group link"><input className="input" placeholder="https://t.me/…" value={v.demoGroupUrl} onChange={(e) => set("demoGroupUrl", e.target.value)} /></Field>
                  <Field label="Telegram channel link"><input className="input" placeholder="https://t.me/…" value={v.demoChannelUrl} onChange={(e) => set("demoChannelUrl", e.target.value)} /></Field>
                  <Field label="Invitation link"><input className="input" placeholder="https://t.me/+…" value={v.demoInviteUrl} onChange={(e) => set("demoInviteUrl", e.target.value)} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Button opens"><select className="input" value={v.demoLinkType} onChange={(e) => set("demoLinkType", e.target.value as ProductFormValue["demoLinkType"])}><option value="GROUP">Group link</option><option value="CHANNEL">Channel link</option><option value="INVITE">Invitation link</option></select></Field>
                  <Field label="Button text"><input className="input" value={v.demoButtonText} onChange={(e) => set("demoButtonText", e.target.value)} maxLength={60} /></Field>
                </div>
              </>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Publishing">
            <Field label="Status">
              <select className="input" value={v.status} onChange={(e) => set("status", e.target.value as ProductFormValue["status"])}>
                <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="UNPUBLISHED">Unpublished</option>
              </select>
            </Field>
            <Toggle checked={v.featured} onChange={(x) => set("featured", x)} label="Featured" hint="Shown first on the homepage." />
            <Toggle checked={v.visible} onChange={(x) => set("visible", x)} label="Visible in listings" hint="Off = only reachable by direct link." />
            <Field label="Sort order" hint="Lower numbers show first."><input className="input" type="number" value={v.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value) || 0)} /></Field>
          </Section>

          <Section title="Related products">
            <Field label="Mode">
              <select className="input" value={v.relatedMode} onChange={(e) => set("relatedMode", e.target.value as "AUTO" | "MANUAL")}>
                <option value="AUTO">Automatic (featured & latest)</option><option value="MANUAL">Choose manually</option>
              </select>
            </Field>
            {v.relatedMode === "MANUAL" && (
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
                {allProducts.filter((p) => p.id !== id).map((p) => (
                  <label key={p.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-ink-soft hover:bg-white/5">
                    <input type="checkbox" className="accent-[#6B1E23]" checked={v.relatedIds.includes(p.id)} onChange={(e) => set("relatedIds", e.target.checked ? [...v.relatedIds, p.id] : v.relatedIds.filter((x) => x !== p.id))} />
                    <span className="truncate">{p.title}</span>
                  </label>
                ))}
                {allProducts.length <= 1 && <p className="p-2 text-xs text-ink-muted">No other products yet.</p>}
              </div>
            )}
          </Section>

          <Section title="SEO">
            <Field label="SEO title" hint={`${v.seoTitle.length}/60 recommended`}><input className="input" value={v.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={200} /></Field>
            <Field label="SEO description" hint={`${v.seoDescription.length}/160 recommended`}><textarea className="input" rows={3} value={v.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={500} /></Field>
          </Section>
        </div>
      </div>
      <SaveBar busy={busy} msg={msg} label={id ? "Save product" : "Create product"} />
    </form>
  );
}
