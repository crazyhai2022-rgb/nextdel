type Point = { label: string; value: number };

/** Minimal dependency-free bar chart. */
export function BarChart({ data, format = (v: number) => String(v), color = "#b8454c", height = 180 }: { data: Point[]; format?: (v: number) => string; color?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / Math.max(1, data.length);
  const step = Math.max(1, Math.ceil(data.length / 8));
  return (
    <div>
      <div className="relative" style={{ height }}>
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => <div key={i} className="border-t border-dashed border-white/[0.06]" />)}
        </div>
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-label="Bar chart">
          {data.map((d, i) => {
            const h = (d.value / max) * (height - 6);
            return (
              <rect key={i} x={i * w + w * 0.18} y={height - h} width={w * 0.64} height={Math.max(h, d.value > 0 ? 1.5 : 0)} rx={0.6} fill={color}>
                <title>{`${d.label}: ${format(d.value)}`}</title>
              </rect>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute right-0 top-0 text-[11px] text-ink-muted">{format(max)}</div>
      </div>
      <div className="mt-2 flex text-[10.5px] text-ink-muted">
        {data.map((d, i) => (
          <div key={i} style={{ width: `${w}%` }} className="truncate text-center">{i % step === 0 ? d.label : ""}</div>
        ))}
      </div>
    </div>
  );
}

export function HBarList({ rows, format = (v: number) => String(v) }: { rows: { label: string; value: number; sub?: string }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="py-6 text-center text-sm text-ink-muted">No sales in this period.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-3 text-sm">
            <span className="truncate text-ink-soft">{r.label}</span>
            <span className="shrink-0 text-ink">{format(r.value)}{r.sub && <span className="ml-1.5 text-xs text-ink-muted">{r.sub}</span>}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-white/5"><div className="h-1.5 rounded-full bg-[#b8454c]" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function Donut({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90" role="img" aria-label={`${label} ${pct.toFixed(1)}%`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#b8454c" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} />
      </svg>
      <div>
        <div className="text-3xl font-semibold text-ink">{pct.toFixed(1)}%</div>
        <div className="text-sm text-ink-muted">{label}</div>
      </div>
    </div>
  );
}
