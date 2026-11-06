"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type Props = { enabled: boolean; pixelId: string; requireConsent: boolean; events: Record<string, boolean> };

type W = Window & { fbq?: ((...a: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown }; _fbq?: unknown; __ndPixel?: { events: Record<string, boolean>; active: boolean } };

function loadPixel(pixelId: string) {
  const w = window as W;
  if (w.fbq) return;
  // Official Meta base code (unminified)
  const fbq = function (...args: unknown[]) {
    const f = fbq as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] };
    if (f.callMethod) f.callMethod(...args);
    else f.queue.push(args);
  } as unknown as NonNullable<W["fbq"]>;
  (fbq as unknown as { queue: unknown[] }).queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;
  w.fbq = fbq;
  if (!w._fbq) w._fbq = fbq;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  fbq("init", pixelId);
}

export function MetaPixel({ enabled, pixelId, requireConsent, events }: Props) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<"granted" | "denied" | null | "loading">("loading");
  const active = enabled && (!requireConsent || consent === "granted");

  useEffect(() => {
    try {
      setConsent((localStorage.getItem("nd_consent") as "granted" | "denied" | null) ?? null);
    } catch {
      setConsent(null);
    }
  }, []);

  useEffect(() => {
    const w = window as W;
    w.__ndPixel = { events, active };
    if (active) loadPixel(pixelId);
  }, [active, pixelId, events]);

  useEffect(() => {
    const w = window as W;
    if (active && w.fbq && events.PageView !== false) w.fbq("track", "PageView");
  }, [pathname, active, events.PageView]);

  if (!enabled || !requireConsent || consent !== null) return null;

  const choose = (v: "granted" | "denied") => {
    try {
      localStorage.setItem("nd_consent", v);
    } catch {}
    setConsent(v);
  };

  return (
    <div role="dialog" aria-label="Cookie preferences" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface">
      <div className="container-site flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-soft">
          We use cookies for analytics and to measure our ads. You can accept or decline non-essential cookies.{" "}
          <Link href="/privacy-policy" className="underline">Privacy Policy</Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => choose("denied")} className="btn-outline btn-sm">Decline</button>
          <button onClick={() => choose("granted")} className="btn-primary btn-sm">Accept</button>
        </div>
      </div>
    </div>
  );
}
