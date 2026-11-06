import { discountPercent, formatMoney } from "@/lib/money";

export function Price({ sale, original, size = "md", currency = "INR" }: { sale: number; original: number; size?: "sm" | "md" | "lg"; currency?: string }) {
  const pct = discountPercent(original, sale);
  const saleCls = size === "lg" ? "text-[28px] leading-none" : size === "md" ? "text-[17px]" : "text-[15px]";
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`${saleCls} font-semibold tracking-tight text-ink`}>{formatMoney(sale, currency)}</span>
      {pct > 0 && (
        <>
          <span className={`${size === "lg" ? "text-base" : "text-sm"} text-ink-muted line-through decoration-1`}>{formatMoney(original, currency)}</span>
          <span className={`${size === "lg" ? "text-sm" : "text-xs"} font-semibold`} style={{ color: "var(--accent-label)" }}>
            {pct}% off
          </span>
        </>
      )}
    </div>
  );
}
