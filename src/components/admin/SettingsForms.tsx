"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionButton, adminFetch, Field, SaveBar, Toggle, UploadButton } from "./client";
import { CopyButton } from "@/components/shop/CopyButton";
import { TrashIcon } from "@/components/icons";
import type { BrandingSettings, CheckoutSettings, FooterSettings, GeneralSettings, HomepageSettings, SeoSettings, SupportSettings } from "@/lib/settings";

function useSave(section: string) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function save(data: unknown) {
    setBusy(true);
    setMsg(null);
    const r = await adminFetch(`/api/admin/settings/${section}`, "PUT", data);
    setBusy(false);
    setMsg({ ok: !!r.ok, text: r.ok ? String(r.message ?? "Saved") : String(r.error) });
    if (r.ok) router.refresh();
    return r.ok;
  }
  return { busy, msg, save };
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface/60">
      <div className="border-b border-line px-5 py-3.5"><h2 className="text-sm font-semibold text-ink">{title}</h2>{description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}</div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function ImageField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-36 items-center justify-center overflow-hidden rounded-lg border border-line bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value ? <img src={value} alt="" className="max-h-12 max-w-[130px] object-contain" /> : <span className="text-xs text-ink-muted">None</span>}
        </div>
        <UploadButton accept="image/png,image/jpeg,image/webp,image/gif" label={value ? "Replace" : "Upload"} onUploaded={(f) => onChange(f.url ?? "")} />
        {value && <button type="button" onClick={() => onChange("")} className="text-xs text-ink-muted hover:text-red-300">Remove</button>}
      </div>
    </Field>
  );
}

// ───────── General + Branding + Homepage ─────────

export function GeneralForm({ general, branding, homepage }: { general: GeneralSettings; branding: BrandingSettings; homepage: HomepageSettings }) {
  const [g, setG] = useState(general);
  const [b, setB] = useState(branding);
  const [h, setH] = useState(homepage);
  const s1 = useSave("general");
  const s2 = useSave("branding");
  const s3 = useSave("homepage");
  const busy = s1.busy || s2.busy || s3.busy;
  const msg = s1.msg && !s1.msg.ok ? s1.msg : s2.msg && !s2.msg.ok ? s2.msg : s3.msg;
  return (
    <form className="space-y-5" onSubmit={async (e) => { e.preventDefault(); (await s1.save(g)) && (await s2.save(b)) && (await s3.save(h)); }}>
      <Card title="General">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website name"><input className="input" value={g.siteName} onChange={(e) => setG({ ...g, siteName: e.target.value })} /></Field>
          <Field label="Company name"><input className="input" value={g.companyName} onChange={(e) => setG({ ...g, companyName: e.target.value })} /></Field>
          <Field label="Support email"><input className="input" type="email" value={g.supportEmail} onChange={(e) => setG({ ...g, supportEmail: e.target.value })} /></Field>
          <Field label="Tagline"><input className="input" value={g.tagline} onChange={(e) => setG({ ...g, tagline: e.target.value })} /></Field>
          <Field label="Currency" hint="INR recommended. Gateways must support it."><input className="input" value={g.currency} onChange={(e) => setG({ ...g, currency: e.target.value.toUpperCase().slice(0, 3) })} /></Field>
          <Field label="Timezone"><input className="input" value={g.timezone} onChange={(e) => setG({ ...g, timezone: e.target.value })} /></Field>
        </div>
      </Card>
      <Card title="Branding" description="Upload your NEXTDEL logo (transparent PNG works best). Colours apply across the whole site.">
        <div className="grid gap-5 md:grid-cols-2">
          <ImageField label="Website logo" value={g.logoUrl} onChange={(v) => setG({ ...g, logoUrl: v })} hint="Shown in the header (28px tall) and emails." />
          <ImageField label="Favicon" value={g.faviconUrl} onChange={(v) => setG({ ...g, faviconUrl: v })} hint="Square PNG, 512×512." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([["primaryColor", "Primary (buttons)"], ["primaryTextColor", "Button text"], ["accentLabelColor", "Accent (labels, discount)"], ["backgroundColor", "Page background"]] as const).map(([k, label]) => (
            <Field key={k} label={label}>
              <div className="flex gap-2"><input type="color" value={b[k]} onChange={(e) => setB({ ...b, [k]: e.target.value })} className="h-11 w-12 cursor-pointer rounded border border-line bg-transparent" /><input className="input" value={b[k]} onChange={(e) => setB({ ...b, [k]: e.target.value })} /></div>
            </Field>
          ))}
        </div>
        <button type="button" className="text-xs text-rose" onClick={() => setB({ primaryColor: "#6B1E23", primaryTextColor: "#ffffff", accentLabelColor: "#e8a9a2", backgroundColor: "#150709" })}>Reset to Crimson Velvet</button>
      </Card>
      <Card title="Homepage">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product section heading"><input className="input" value={h.heading} onChange={(e) => setH({ ...h, heading: e.target.value })} /></Field>
          <Field label="Default product order">
            <select className="input" value={h.sort} onChange={(e) => setH({ ...h, sort: e.target.value as HomepageSettings["sort"] })}><option value="featured">Featured first</option><option value="latest">Latest</option><option value="price_asc">Price: low → high</option><option value="price_desc">Price: high → low</option></select>
          </Field>
        </div>
        <Toggle checked={h.showIntro} onChange={(v) => setH({ ...h, showIntro: v })} label="Show intro text above products" />
        {h.showIntro && <Field label="Intro text"><textarea className="input" rows={2} value={h.subheading} onChange={(e) => setH({ ...h, subheading: e.target.value })} /></Field>}
        <Toggle checked={h.announcementEnabled} onChange={(v) => setH({ ...h, announcementEnabled: v })} label="Announcement bar" hint="Thin bar above the header." />
        {h.announcementEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Announcement text"><input className="input" value={h.announcementText} onChange={(e) => setH({ ...h, announcementText: e.target.value })} /></Field>
            <Field label="Link (optional)"><input className="input" value={h.announcementLink} onChange={(e) => setH({ ...h, announcementLink: e.target.value })} /></Field>
          </div>
        )}
      </Card>
      <SaveBar busy={busy} msg={msg} />
    </form>
  );
}

// ───────── Payments ─────────

type GatewayState = { enabled: boolean; mode: "TEST" | "LIVE"; testPublicKey: string; livePublicKey: string; has: { testSecret: boolean; liveSecret: boolean; testWebhookSecret: boolean; liveWebhookSecret: boolean } };

export function PaymentsForm({ active, gateways, siteUrl, checkout }: { active: string; gateways: Record<"RAZORPAY" | "CASHFREE", GatewayState>; siteUrl: string; checkout: CheckoutSettings }) {
  const [activeGateway, setActive] = useState(active);
  const [g, setG] = useState(gateways);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [c, setC] = useState(checkout);
  const s = useSave("payments");
  const s2 = useSave("checkout");
  const upd = (gw: "RAZORPAY" | "CASHFREE", patch: Partial<GatewayState>) => setG({ ...g, [gw]: { ...g[gw], ...patch } });
  const sec = (k: string) => secrets[k] ?? "";
  const LABELS = { RAZORPAY: { pub: "Key ID", sec: "Key Secret", live: "Live" }, CASHFREE: { pub: "Client ID (App ID)", sec: "Client Secret", live: "Production" } };

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const body = {
          activeGateway,
          gateways: Object.fromEntries((["RAZORPAY", "CASHFREE"] as const).map((gw) => [gw, {
            enabled: g[gw].enabled, mode: "LIVE" as const, testPublicKey: g[gw].testPublicKey, livePublicKey: g[gw].livePublicKey,
            testSecret: sec(`${gw}.testSecret`), liveSecret: sec(`${gw}.liveSecret`), testWebhookSecret: sec(`${gw}.testWebhookSecret`), liveWebhookSecret: sec(`${gw}.liveWebhookSecret`),
          }])),
        };
        const ok = await s.save(body);
        await s2.save(c);
        if (ok) setSecrets({});
      }}
    >
      <Card title="Active checkout gateway" description="Only the selected gateway is shown to customers. Switching affects new checkouts only; existing orders keep their gateway.">
        <div className="grid gap-2 sm:grid-cols-3">
          {[{ k: "RAZORPAY", l: "Razorpay" }, { k: "CASHFREE", l: "Cashfree" }, { k: "", l: "None (checkout off)" }].map((o) => (
            <label key={o.k} className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${activeGateway === o.k ? "border-rose/60 bg-crimson/30 text-ink" : "border-line text-ink-soft"}`}>
              <input type="radio" name="active" className="accent-[#6B1E23]" checked={activeGateway === o.k} onChange={() => setActive(o.k)} /> {o.l}
            </label>
          ))}
        </div>
      </Card>

      {(["RAZORPAY", "CASHFREE"] as const).map((gw) => {
        const st = g[gw];
        const L = LABELS[gw];
        const secretInput = (key: "testSecret" | "liveSecret" | "testWebhookSecret" | "liveWebhookSecret", label: string, hint?: string) => (
          <Field label={label} hint={hint ?? (st.has[key] ? "Saved (hidden). Leave blank to keep, type a new value to replace." : "Not set")}>
            <div className="flex gap-2">
              <input className="input" type="password" autoComplete="new-password" placeholder={st.has[key] ? "••••••••  (saved)" : ""} value={sec(`${gw}.${key}`)} onChange={(e) => setSecrets({ ...secrets, [`${gw}.${key}`]: e.target.value })} />
              {st.has[key] && <button type="button" className="text-xs text-ink-muted hover:text-red-300" onClick={() => setSecrets({ ...secrets, [`${gw}.${key}`]: "__clear__" })}>Clear</button>}
            </div>
          </Field>
        );
        return (
          <Card key={gw} title={gw === "RAZORPAY" ? "Razorpay" : "Cashfree Payments"} description="Secrets are encrypted in the database and never sent to the browser.">
            <Toggle checked={st.enabled} onChange={(v) => upd(gw, { enabled: v })} label={`Enable ${gw === "RAZORPAY" ? "Razorpay" : "Cashfree"}`} />
            <div className="grid gap-5">
              <div className="space-y-3 rounded-lg border border-line p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{L.live} credentials</div>
                <Field label={L.pub}><input className="input" value={st.livePublicKey} onChange={(e) => upd(gw, { livePublicKey: e.target.value })} placeholder={gw === "RAZORPAY" ? "rzp_live_…" : ""} /></Field>
                {secretInput("liveSecret", L.sec)}
                {gw === "RAZORPAY" && secretInput("liveWebhookSecret", "Webhook secret")}
                <ActionButton url="/api/admin/settings/payments" body={{ gateway: gw, mode: "LIVE" }} label="Check saved credentials" />
              </div>
            </div>
            <div className="rounded-lg border border-line bg-black/20 p-3 text-xs text-ink-soft">
              <div className="mb-1 font-medium text-ink">Webhook URL</div>
              <div className="flex flex-wrap items-center gap-2"><code className="break-all">{siteUrl}/api/webhooks/{gw.toLowerCase()}</code><CopyButton text={`${siteUrl}/api/webhooks/${gw.toLowerCase()}`} label="Copy" /></div>
              <p className="mt-2 text-ink-muted">
                {gw === "RAZORPAY"
                  ? "Razorpay Dashboard → Settings → Webhooks → Add. Events: payment.captured, payment.failed, order.paid. Use the same secret you enter above."
                  : "Cashfree Dashboard → Developers → Webhooks → Add (Payment webhooks, version 2023-08-01). Signed with your Client Secret — no separate secret needed."}
              </p>
            </div>
          </Card>
        );
      })}

      <Card title="Checkout options">
        <Field label="Secure payment note"><textarea className="input" rows={2} value={c.secureNote} onChange={(e) => setC({ ...c, secureNote: e.target.value })} /></Field>
        <Field label="Expire unpaid orders after (hours)" hint="Unpaid orders are checked with the gateway first, then marked Expired."><input className="input w-32" type="number" min={1} value={c.pendingExpiryHours} onChange={(e) => setC({ ...c, pendingExpiryHours: Number(e.target.value) || 24 })} /></Field>
        <Toggle checked={c.requireAgeConfirmation} onChange={(v) => setC({ ...c, requireAgeConfirmation: v })} label="Require age confirmation at checkout" hint="Shows a required checkbox (recommended for age-restricted content)." />
        {c.requireAgeConfirmation && <Field label="Checkbox text"><input className="input" value={c.ageConfirmationText} onChange={(e) => setC({ ...c, ageConfirmationText: e.target.value })} /></Field>}
      </Card>
      <SaveBar busy={s.busy || s2.busy} msg={s.msg && !s.msg.ok ? s.msg : s2.msg && !s2.msg.ok ? s2.msg : s.msg} />
    </form>
  );
}

// ───────── Email ─────────

export function EmailForm({ initial, hasPassword }: { initial: { host: string; port: number; secure: boolean; username: string; fromName: string; fromEmail: string; replyTo: string; sendPendingEmail: boolean; sendFailedEmail: boolean }; hasPassword: boolean }) {
  const [v, setV] = useState({ ...initial, password: "" });
  const [testTo, setTestTo] = useState("");
  const s = useSave("email");
  return (
    <form className="space-y-5" onSubmit={async (e) => { e.preventDefault(); if (await s.save(v)) setV({ ...v, password: "" }); }}>
      <Card title="SMTP server" description="Hostinger email: host smtp.hostinger.com, port 465 (SSL). Use a mailbox you created in hPanel → Emails.">
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <Field label="SMTP host"><input className="input" value={v.host} onChange={(e) => setV({ ...v, host: e.target.value })} /></Field>
          <Field label="Port"><input className="input" type="number" value={v.port} onChange={(e) => setV({ ...v, port: Number(e.target.value) || 465 })} /></Field>
        </div>
        <Toggle checked={v.secure} onChange={(x) => setV({ ...v, secure: x })} label="Use SSL/TLS (port 465)" hint="Turn off for STARTTLS on port 587." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SMTP username"><input className="input" autoComplete="off" value={v.username} onChange={(e) => setV({ ...v, username: e.target.value })} /></Field>
          <Field label="SMTP password" hint={hasPassword ? "Saved (hidden). Leave blank to keep." : "Not set"}><input className="input" type="password" autoComplete="new-password" placeholder={hasPassword ? "•••••••• (saved)" : ""} value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} /></Field>
          <Field label="Sender name"><input className="input" value={v.fromName} onChange={(e) => setV({ ...v, fromName: e.target.value })} /></Field>
          <Field label="Sender email" hint="Usually the same as the SMTP username."><input className="input" type="email" value={v.fromEmail} onChange={(e) => setV({ ...v, fromEmail: e.target.value })} /></Field>
          <Field label="Reply-to email (optional)"><input className="input" type="email" value={v.replyTo} onChange={(e) => setV({ ...v, replyTo: e.target.value })} /></Field>
        </div>
      </Card>
      <Card title="Automatic emails">
        <p className="text-sm text-ink-soft">Order confirmation with product access is always sent after verified payment.</p>
        <Toggle checked={v.sendPendingEmail} onChange={(x) => setV({ ...v, sendPendingEmail: x })} label="Payment pending notice" hint="Sent when a payment is awaiting gateway confirmation." />
        <Toggle checked={v.sendFailedEmail} onChange={(x) => setV({ ...v, sendFailedEmail: x })} label="Payment failed notice" hint="Sent ~20 minutes after a failed payment if the customer hasn't retried successfully." />
      </Card>
      <Card title="Send test email" description="Save your settings first.">
        <div className="flex flex-wrap items-start gap-2">
          <input className="input h-9 max-w-xs" type="email" placeholder="you@example.com" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          <ActionButton url="/api/admin/emails/test" body={{ to: testTo }} label="Send test" />
        </div>
      </Card>
      <SaveBar busy={s.busy} msg={s.msg} />
    </form>
  );
}

// ───────── Tracking ─────────

export function TrackingForm({ initial, hasToken, siteUrl }: { initial: { pixelEnabled: boolean; pixelId: string; capiEnabled: boolean; testEventCode: string; requireConsent: boolean; events: Record<string, boolean>; verificationStatus: string | null }; hasToken: boolean; siteUrl: string }) {
  const [v, setV] = useState({ ...initial, capiToken: "" });
  const s = useSave("tracking");
  const EVENTS = ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "AddPaymentInfo", "Purchase"];
  return (
    <form className="space-y-5" onSubmit={async (e) => { e.preventDefault(); if (await s.save(v)) setV({ ...v, capiToken: "" }); }}>
      <Card title="Meta Pixel" description="Browser-side tracking. Purchase fires only on the success/thank-you page after verified payment.">
        <Toggle checked={v.pixelEnabled} onChange={(x) => setV({ ...v, pixelEnabled: x })} label="Enable Meta Pixel" />
        <Field label="Pixel ID"><input className="input max-w-xs" inputMode="numeric" value={v.pixelId} onChange={(e) => setV({ ...v, pixelId: e.target.value.replace(/\D/g, "") })} /></Field>
        <Toggle checked={v.requireConsent} onChange={(x) => setV({ ...v, requireConsent: x })} label="Require cookie consent before tracking" hint="Shows a consent banner; Pixel loads only after the visitor accepts." />
        <div>
          <div className="label">Events</div>
          <div className="grid gap-2 sm:grid-cols-3">
            {EVENTS.map((ev) => (
              <label key={ev} className="flex items-center gap-2 text-sm text-ink-soft"><input type="checkbox" className="accent-[#6B1E23]" checked={v.events[ev] !== false} onChange={(e) => setV({ ...v, events: { ...v.events, [ev]: e.target.checked } })} /> {ev}</label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton url="/api/admin/settings/tracking" label="Verify Pixel" />
          {initial.verificationStatus && <span className="text-xs text-ink-muted">Last check: {initial.verificationStatus}</span>}
        </div>
      </Card>
      <Card title="Meta Conversions API (optional)" description="Server-side Purchase event, deduplicated with the browser Pixel using the same event ID (purchase_<orderId>). The access token stays on the server.">
        <Toggle checked={v.capiEnabled} onChange={(x) => setV({ ...v, capiEnabled: x })} label="Enable Conversions API" />
        <Field label="Access token" hint={hasToken ? "Saved (hidden). Leave blank to keep." : "Events Manager → Settings → Conversions API → Generate access token"}><input className="input" type="password" autoComplete="new-password" placeholder={hasToken ? "•••••••• (saved)" : ""} value={v.capiToken} onChange={(e) => setV({ ...v, capiToken: e.target.value })} /></Field>
        <Field label="Test event code (optional)" hint="From Events Manager → Test events. Remove before going live."><input className="input max-w-xs" value={v.testEventCode} onChange={(e) => setV({ ...v, testEventCode: e.target.value })} /></Field>
        <p className="text-xs text-ink-muted">Your domain for Meta domain verification: {siteUrl.replace(/^https?:\/\//, "")}</p>
      </Card>
      <SaveBar busy={s.busy} msg={s.msg} />
    </form>
  );
}

// ───────── Social + Footer + Support + SEO ─────────

const PLATFORMS = ["telegram", "instagram", "youtube", "facebook", "x", "whatsapp", "other"];

export function SiteForm({ social, footer, support, seo }: { social: { platform: string; label: string; url: string; enabled: boolean }[]; footer: FooterSettings; support: SupportSettings; seo: SeoSettings }) {
  const [links, setLinks] = useState(social.length ? social : [{ platform: "telegram", label: "Telegram", url: "", enabled: true }]);
  const [f, setF] = useState(footer);
  const [sup, setSup] = useState(support);
  const [sv, setSeo] = useState(seo);
  const a = useSave("social");
  const b = useSave("footer");
  const c = useSave("support");
  const d = useSave("seo");
  const msgs = [a.msg, b.msg, c.msg, d.msg];
  const err = msgs.find((m) => m && !m.ok);
  return (
    <form className="space-y-5" onSubmit={async (e) => { e.preventDefault(); (await a.save({ links })) && (await b.save(f)) && (await c.save(sup)) && (await d.save(sv)); }}>
      <Card title="Social media links" description="Shown in the footer. Toggle individual links on/off.">
        {links.map((l, i) => (
          <div key={i} className="grid items-center gap-2 sm:grid-cols-[130px_150px_1fr_auto_auto]">
            <select className="input h-9" value={l.platform} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)))}>{PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
            <input className="input h-9" placeholder="Label" value={l.label} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input className="input h-9" placeholder="https://…" value={l.url} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            <label className="flex items-center gap-1.5 text-xs text-ink-soft"><input type="checkbox" className="accent-[#6B1E23]" checked={l.enabled} onChange={(e) => setLinks(links.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} /> On</label>
            <button type="button" onClick={() => setLinks(links.filter((_, j) => j !== i))} className="p-1 text-ink-muted hover:text-red-300" aria-label="Remove"><TrashIcon size={16} /></button>
          </div>
        ))}
        <button type="button" className="btn-outline btn-sm" onClick={() => setLinks([...links, { platform: "instagram", label: "Instagram", url: "", enabled: true }])}>Add link</button>
      </Card>
      <Card title="Footer">
        <Field label="About text"><textarea className="input" rows={2} value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact email"><input className="input" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></Field>
          <Field label="Copyright" hint="{year} is replaced automatically."><input className="input" value={f.copyright} onChange={(e) => setF({ ...f, copyright: e.target.value })} /></Field>
        </div>
        <Toggle checked={f.showAddress} onChange={(x) => setF({ ...f, showAddress: x })} label="Show company address" />
        {f.showAddress && <Field label="Address"><textarea className="input" rows={2} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>}
        <Field label="Footer disclaimer (optional)" hint="e.g. age restriction notice"><input className="input" value={f.disclaimer} onChange={(e) => setF({ ...f, disclaimer: e.target.value })} /></Field>
        <div>
          <div className="label">Link columns</div>
          <div className="grid gap-3 lg:grid-cols-3">
            {f.columns.map((col, ci) => (
              <div key={ci} className="space-y-2 rounded-lg border border-line p-3">
                <div className="flex gap-2"><input className="input h-9 font-medium" value={col.title} onChange={(e) => setF({ ...f, columns: f.columns.map((c2, j) => (j === ci ? { ...c2, title: e.target.value } : c2)) })} /><button type="button" className="text-ink-muted hover:text-red-300" onClick={() => setF({ ...f, columns: f.columns.filter((_, j) => j !== ci) })} aria-label="Remove column"><TrashIcon size={16} /></button></div>
                {col.links.map((l, li) => (
                  <div key={li} className="flex gap-1.5">
                    <input className="input h-8 text-xs" placeholder="Label" value={l.label} onChange={(e) => setF({ ...f, columns: f.columns.map((c2, j) => (j === ci ? { ...c2, links: c2.links.map((x, k) => (k === li ? { ...x, label: e.target.value } : x)) } : c2)) })} />
                    <input className="input h-8 text-xs" placeholder="/page or https://" value={l.href} onChange={(e) => setF({ ...f, columns: f.columns.map((c2, j) => (j === ci ? { ...c2, links: c2.links.map((x, k) => (k === li ? { ...x, href: e.target.value } : x)) } : c2)) })} />
                    <button type="button" className="text-ink-muted hover:text-red-300" onClick={() => setF({ ...f, columns: f.columns.map((c2, j) => (j === ci ? { ...c2, links: c2.links.filter((_, k) => k !== li) } : c2)) })} aria-label="Remove link">×</button>
                  </div>
                ))}
                <button type="button" className="text-xs text-rose" onClick={() => setF({ ...f, columns: f.columns.map((c2, j) => (j === ci ? { ...c2, links: [...c2.links, { label: "", href: "/" }] } : c2)) })}>+ Link</button>
              </div>
            ))}
          </div>
          {f.columns.length < 5 && <button type="button" className="btn-outline btn-sm mt-3" onClick={() => setF({ ...f, columns: [...f.columns, { title: "New column", links: [] }] })}>Add column</button>}
        </div>
      </Card>
      <Card title="Customer support">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telegram support link"><input className="input" value={sup.telegramSupportUrl} onChange={(e) => setSup({ ...sup, telegramSupportUrl: e.target.value })} placeholder="https://t.me/…" /></Field>
          <Field label="WhatsApp link (optional)"><input className="input" value={sup.whatsappUrl} onChange={(e) => setSup({ ...sup, whatsappUrl: e.target.value })} placeholder="https://wa.me/91…" /></Field>
          <Field label="Support hours"><input className="input" value={sup.supportHours} onChange={(e) => setSup({ ...sup, supportHours: e.target.value })} /></Field>
          <Field label="Support note"><input className="input" value={sup.supportNote} onChange={(e) => setSup({ ...sup, supportNote: e.target.value })} /></Field>
        </div>
        <Toggle checked={sup.contactFormEnabled} onChange={(x) => setSup({ ...sup, contactFormEnabled: x })} label="Enable contact form" hint="Submissions appear under Inquiries." />
      </Card>
      <Card title="SEO">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default page title"><input className="input" value={sv.defaultTitle} onChange={(e) => setSeo({ ...sv, defaultTitle: e.target.value })} /></Field>
          <Field label="Title template" hint="%s is replaced by the page title."><input className="input" value={sv.titleTemplate} onChange={(e) => setSeo({ ...sv, titleTemplate: e.target.value })} /></Field>
        </div>
        <Field label="Default meta description"><textarea className="input" rows={2} value={sv.description} onChange={(e) => setSeo({ ...sv, description: e.target.value })} /></Field>
        <Field label="Keywords (optional)"><input className="input" value={sv.keywords} onChange={(e) => setSeo({ ...sv, keywords: e.target.value })} /></Field>
        <ImageField label="Default social share image (1200×630)" value={sv.ogImage} onChange={(x) => setSeo({ ...sv, ogImage: x })} />
        <Toggle checked={sv.allowIndexing} onChange={(x) => setSeo({ ...sv, allowIndexing: x })} label="Allow search engines to index the site" />
      </Card>
      <SaveBar busy={a.busy || b.busy || c.busy || d.busy} msg={err ?? d.msg} />
    </form>
  );
}
