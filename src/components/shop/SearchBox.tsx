"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import { formatINR } from "@/lib/client";

type Hit = { slug: string; title: string; salePrice: number; thumbnailUrl: string | null };

export function SearchBox({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/products/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setHits(d.results ?? []))
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <form
      ref={boxRef}
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        router.push(`/products?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <SearchIcon size={16} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search products"
        aria-label="Search products"
        className={`h-9 w-full rounded border border-line bg-black/20 pl-8 pr-3 text-sm placeholder:text-ink-muted/70 focus:border-ink focus:bg-black/30 focus:outline-none ${compact ? "md:w-56" : ""}`}
      />
      {open && hits.length > 0 && (
        <ul className="absolute right-0 top-full z-50 mt-1 w-full min-w-[280px] overflow-hidden rounded-xl border border-line bg-surface shadow-velvet">
          {hits.map((h) => (
            <li key={h.slug}>
              <a href={`/product/${h.slug}`} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5">
                <span className="relative block aspect-video w-16 shrink-0 overflow-hidden rounded bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {h.thumbnailUrl && <img src={h.thumbnailUrl} alt="" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{h.title}</span>
                  <span className="text-xs text-ink-muted">{formatINR(h.salePrice)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
