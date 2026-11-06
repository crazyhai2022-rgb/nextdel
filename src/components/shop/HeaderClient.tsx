"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CartIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { useCart } from "./CartProvider";
import { SearchBox } from "./SearchBox";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
];

export function HeaderClient() {
  const { count, ready } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <nav className="hidden flex-1 items-center gap-7 pl-6 md:flex" aria-label="Main">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`text-[14px] font-medium transition-colors ${isActive(n.href) ? "text-ink" : "text-ink-muted hover:text-ink"}`}>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-1">
        <div className="hidden md:block">
          <SearchBox compact />
        </div>
        <Link href="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded text-ink hover:bg-white/5" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
          <CartIcon size={22} />
          {ready && count > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose px-1 text-[11px] font-semibold leading-none text-surface">
              {count}
            </span>
          )}
        </Link>
        <button className="inline-flex h-10 w-10 items-center justify-center rounded text-ink hover:bg-white/5 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
          {open ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
        </button>
      </div>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-night md:hidden">
          <div className="container-site space-y-1 py-3">
            <div className="pb-2"><SearchBox /></div>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`block rounded px-2 py-2.5 text-[15px] font-medium ${isActive(n.href) ? "bg-white/5 text-ink" : "text-ink-soft"}`}>
                {n.label}
              </Link>
            ))}
            <Link href="/order-lookup" className="block rounded px-2 py-2.5 text-[15px] font-medium text-ink-soft">Order lookup</Link>
          </div>
        </div>
      )}
    </>
  );
}
