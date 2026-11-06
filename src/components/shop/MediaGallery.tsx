"use client";

import Image from "next/image";
import { useState } from "react";
import { PlayIcon } from "@/components/icons";

export type MediaItem =
  | { type: "image"; src: string; alt: string }
  | { type: "embed"; src: string; title: string; poster?: string | null }
  | { type: "video"; src: string; title: string; poster?: string | null };

export function MediaGallery({ items, title }: { items: MediaItem[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = items[active];
  if (!current) {
    return <div className="flex aspect-video items-center justify-center rounded-2xl border border-line bg-surface text-ink-muted">{title}</div>;
  }
  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-black shadow-velvet">
        {current.type === "image" && (
          <Image src={current.src} alt={current.alt} fill priority sizes="(min-width:1024px) 640px, 100vw" className="object-cover" />
        )}
        {current.type === "embed" && (
          <iframe src={current.src} title={current.title} className="h-full w-full" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
        )}
        {current.type === "video" && (
          <video src={current.src} poster={current.poster ?? undefined} controls playsInline preload="metadata" className="h-full w-full bg-black object-contain" />
        )}
      </div>
      {items.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {items.map((m, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show media ${i + 1}`}
              className={`relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg border bg-surface sm:w-28 ${i === active ? "border-rose" : "border-line opacity-70 hover:opacity-100"}`}
            >
              {m.type === "image" ? (
                <Image src={m.src} alt="" fill sizes="112px" className="object-cover" />
              ) : m.poster ? (
                <Image src={m.poster} alt="" fill sizes="112px" className="object-cover" />
              ) : null}
              {m.type !== "image" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white"><PlayIcon size={18} /></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
