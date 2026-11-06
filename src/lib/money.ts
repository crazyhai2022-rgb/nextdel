/** Amounts are integers in paise. */
export function formatMoney(paise: number, currency = "INR"): string {
  const value = paise / 100;
  const whole = Number.isInteger(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function toPaise(rupees: number | string): number {
  const n = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function toRupees(paise: number): number {
  return Math.round(paise) / 100;
}

export function discountPercent(original: number, sale: number): number {
  if (!original || sale >= original) return 0;
  return Math.round(((original - sale) / original) * 100);
}
