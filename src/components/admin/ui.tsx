import Link from "next/link";
import { STATUS_TONE } from "@/lib/orders";

const TONES: Record<string, string> = {
  green: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  red: "border-red-400/30 bg-red-400/10 text-red-200",
  slate: "border-sky-300/20 bg-sky-300/10 text-sky-200",
  zinc: "border-white/15 bg-white/5 text-ink-muted",
  violet: "border-violet-300/30 bg-violet-300/10 text-violet-200",
};

export function Badge({ status, label, tone }: { status?: string; label: string; tone?: string }) {
  const t = tone ?? STATUS_TONE[status ?? ""] ?? "zinc";
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11.5px] font-medium ${TONES[t] ?? TONES.zinc}`}>{label}</span>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, actions, className = "" }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-surface/60 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface/60 p-4">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-1.5 text-[22px] font-semibold tracking-tight text-ink">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: string }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface/40">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-muted">
          <tr>{head.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {hasRows ? children : <tr><td colSpan={head.length} className="px-4 py-12 text-center text-ink-muted">{empty ?? "Nothing here yet."}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export const td = "px-4 py-3 align-middle text-ink-soft";

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 && <Link href={makeHref(page - 1)} className="btn-outline btn-sm">Previous</Link>}
        {page < pages && <Link href={makeHref(page + 1)} className="btn-outline btn-sm">Next</Link>}
      </div>
    </div>
  );
}

export function FilterTabs({ tabs, active }: { tabs: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <div className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto px-1">
      {tabs.map((t) => (
        <Link key={t.key} href={t.href} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] ${active === t.key ? "border-rose/50 bg-crimson/40 text-ink" : "border-line text-ink-muted hover:text-ink"}`}>
          {t.label}{typeof t.count === "number" && <span className="ml-1.5 text-ink-muted">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}

export function fmtDate(d: Date | null | undefined, withTime = true) {
  if (!d) return "—";
  return d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) });
}

export function SearchForm({ action, defaultValue, placeholder, hidden }: { action: string; defaultValue?: string; placeholder: string; hidden?: Record<string, string> }) {
  return (
    <form action={action} className="flex w-full gap-2 sm:w-auto">
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <input name="q" defaultValue={defaultValue} placeholder={placeholder} className="input h-9 sm:w-72" />
      <button className="btn-outline btn-sm">Search</button>
    </form>
  );
}
