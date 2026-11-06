"use client";

import { useEffect, useRef, useState } from "react";

const TOOLS: { cmd: string; arg?: string; label: string; title: string }[] = [
  { cmd: "formatBlock", arg: "H2", label: "H2", title: "Heading" },
  { cmd: "formatBlock", arg: "H3", label: "H3", title: "Subheading" },
  { cmd: "formatBlock", arg: "P", label: "¶", title: "Paragraph" },
  { cmd: "bold", label: "B", title: "Bold" },
  { cmd: "italic", label: "I", title: "Italic" },
  { cmd: "underline", label: "U", title: "Underline" },
  { cmd: "insertUnorderedList", label: "• List", title: "Bullet list" },
  { cmd: "insertOrderedList", label: "1. List", title: "Numbered list" },
  { cmd: "formatBlock", arg: "BLOCKQUOTE", label: "❝", title: "Quote" },
  { cmd: "insertHorizontalRule", label: "—", title: "Divider" },
];

/** Lightweight rich text editor (HTML is sanitised on the server before saving). */
export function RichTextEditor({ value, onChange, minHeight = 180, placeholder }: { value: string; onChange: (html: string) => void; minHeight?: number; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [source, setSource] = useState(false);

  useEffect(() => {
    if (ref.current && !source && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-black/20 focus-within:border-rose/60">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-white/[0.03] p-1">
        {!source && TOOLS.map((t) => (
          <button key={t.title} type="button" title={t.title} onMouseDown={(e) => { e.preventDefault(); exec(t.cmd, t.arg); }} className="rounded px-2 py-1 text-xs text-ink-soft hover:bg-white/10 hover:text-ink">{t.label}</button>
        ))}
        {!source && (
          <>
            <button type="button" title="Link" onMouseDown={(e) => { e.preventDefault(); const url = prompt("Link URL (https://…)"); if (url) exec("createLink", url); }} className="rounded px-2 py-1 text-xs text-ink-soft hover:bg-white/10">Link</button>
            <button type="button" title="Image by URL" onMouseDown={(e) => { e.preventDefault(); const url = prompt("Image URL (/media/… or https://…)"); if (url) exec("insertImage", url); }} className="rounded px-2 py-1 text-xs text-ink-soft hover:bg-white/10">Image</button>
            <button type="button" title="YouTube embed" onMouseDown={(e) => {
              e.preventDefault();
              const url = prompt("YouTube or Vimeo URL");
              if (!url) return;
              const yt = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
              const vm = url.match(/vimeo\.com\/(\d+)/);
              const src = yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}` : vm ? `https://player.vimeo.com/video/${vm[1]}` : null;
              if (src) exec("insertHTML", `<iframe src="${src}" allowfullscreen frameborder="0"></iframe><p></p>`);
            }} className="rounded px-2 py-1 text-xs text-ink-soft hover:bg-white/10">Video</button>
            <button type="button" title="Clear formatting" onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }} className="rounded px-2 py-1 text-xs text-ink-soft hover:bg-white/10">Clear</button>
          </>
        )}
        <button type="button" onClick={() => setSource((s) => !s)} className="ml-auto rounded px-2 py-1 text-xs text-ink-muted hover:bg-white/10">{source ? "Visual" : "HTML"}</button>
      </div>
      {source ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className="block w-full bg-transparent p-3 font-mono text-xs text-ink-soft outline-none" style={{ minHeight }} spellCheck={false} />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => onChange(ref.current?.innerHTML ?? "")}
          onPaste={(e) => {
            e.preventDefault();
            const html = e.clipboardData.getData("text/html");
            const text = e.clipboardData.getData("text/plain");
            if (html) {
              const clean = html.replace(/<(script|style|meta|link)[\s\S]*?>[\s\S]*?<\/\1>|<(meta|link)[^>]*>/gi, "").replace(/ (style|class|id|on\w+)="[^"]*"/gi, "");
              document.execCommand("insertHTML", false, clean);
            } else document.execCommand("insertText", false, text);
            onChange(ref.current?.innerHTML ?? "");
          }}
          data-placeholder={placeholder}
          className="rich max-w-none p-3 outline-none empty:before:text-ink-muted/60 empty:before:content-[attr(data-placeholder)]"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
