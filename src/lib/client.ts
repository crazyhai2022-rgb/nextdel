"use client";

/** Browser-only helpers (no secrets). */
export function getVisitorId(): string {
  try {
    let id = localStorage.getItem("nd_vid");
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^a-z0-9-]/gi, "");
      localStorage.setItem("nd_vid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

type FbqWindow = Window & {
  fbq?: (...args: unknown[]) => void;
  __ndPixel?: { events: Record<string, boolean>; active: boolean };
};

/** Fires a Meta Pixel standard event if tracking is enabled, consented and the event is switched on. */
export function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined") return;
  const w = window as FbqWindow;
  if (!w.__ndPixel?.active || !w.fbq) return;
  if (w.__ndPixel.events[event] === false) return;
  if (eventId) w.fbq("track", event, params ?? {}, { eventID: eventId });
  else w.fbq("track", event, params ?? {});
}

export async function postJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<T & { ok?: boolean; error?: string }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({ ok: false, error: `Request failed (${res.status})` }));
  if (!res.ok && data && typeof data === "object" && !("error" in data)) (data as Record<string, unknown>).error = `Request failed (${res.status})`;
  return data;
}

export function formatINR(paise: number, currency = "INR") {
  const v = paise / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }).format(v);
}
