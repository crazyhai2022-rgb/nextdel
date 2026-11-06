"use client";

import { useState } from "react";
import { CopyIcon, CheckIcon } from "@/components/icons";

export function CopyButton({ text, label = "Copy Link", className = "btn-outline btn-sm" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      }}
    >
      {done ? <CheckIcon size={16} /> : <CopyIcon size={16} />} {done ? "Copied" : label}
    </button>
  );
}
