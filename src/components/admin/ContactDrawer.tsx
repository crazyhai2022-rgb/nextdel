"use client";

import { useState } from "react";
import { EmailComposer } from "./EmailComposer";
import { CloseIcon } from "@/components/icons";

export function ContactDrawer({ checkoutId, email, name, products }: { checkoutId: string; email: string; name: string | null; products: string[] }) {
  const [open, setOpen] = useState(false);
  const first = name?.split(" ")[0] || "there";
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline btn-sm">Contact</button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-line bg-paper p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-ink">Email {email}</h2><button onClick={() => setOpen(false)} aria-label="Close"><CloseIcon /></button></div>
            <EmailComposer
              to={email}
              checkoutId={checkoutId}
              defaultSubject="Need help completing your order?"
              defaultMessage={`Hi ${first},\n\nWe noticed you started checking out${products.length ? ` "${products.join(", ")}"` : ""} but the payment wasn't completed.\n\nIf you faced any issue with the payment, just reply to this email and we'll help you right away.\n\nThanks!`}
            />
          </div>
        </div>
      )}
    </>
  );
}
