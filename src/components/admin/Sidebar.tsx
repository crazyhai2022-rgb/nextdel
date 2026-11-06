"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MenuIcon, CloseIcon } from "@/components/icons";
import { adminFetch } from "./client";

type Item = { href: string; label: string; perm: string };
const NAV: { group: string; items: Item[] }[] = [
  { group: "Overview", items: [{ href: "/admin", label: "Dashboard", perm: "dashboard" }] },
  {
    group: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", perm: "orders" },
      { href: "/admin/abandoned", label: "Abandoned Checkouts", perm: "abandoned" },
      { href: "/admin/customers", label: "Customers", perm: "customers" },
    ],
  },
  { group: "Catalog", items: [{ href: "/admin/products", label: "Products", perm: "products" }] },
  {
    group: "Communication",
    items: [
      { href: "/admin/emails", label: "Emails", perm: "emails" },
      { href: "/admin/inquiries", label: "Inquiries", perm: "inquiries" },
    ],
  },
  {
    group: "Website",
    items: [
      { href: "/admin/pages", label: "Pages (CMS)", perm: "pages" },
      { href: "/admin/settings", label: "Settings", perm: "settings" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/admin/users", label: "Admin Users", perm: "users" },
      { href: "/admin/audit", label: "Audit Log", perm: "audit" },
    ],
  },
];

export function Sidebar({ perms, admin, siteName }: { perms: string[]; admin: { name: string; email: string; role: string }; siteName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const allowed = (p: string) => perms.includes("*") || perms.includes(p);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-line px-4">
        <Link href="/admin" className="heading-spaced text-[13px]">{siteName}</Link>
        <Link href="/" target="_blank" className="text-xs text-ink-muted hover:text-ink">View site ↗</Link>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((g) => {
          const items = g.items.filter((i) => allowed(i.perm));
          if (!items.length) return null;
          return (
            <div key={g.group} className="mb-4">
              <div className="px-2 pb-1 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-muted/80">{g.group}</div>
              {items.map((i) => (
                <Link key={i.href} href={i.href} className={`block rounded-lg px-2.5 py-2 text-[13.5px] ${active(i.href) ? "bg-crimson/50 text-ink" : "text-ink-soft hover:bg-white/5 hover:text-ink"}`}>
                  {i.label}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
      <div className="border-t border-line p-3">
        <div className="truncate text-sm text-ink">{admin.name}</div>
        <div className="truncate text-xs text-ink-muted">{admin.email} · {admin.role.replace("_", " ").toLowerCase()}</div>
        <button
          className="mt-2 text-xs text-ink-muted hover:text-rose"
          onClick={async () => {
            await adminFetch("/api/admin/auth/logout", "POST");
            window.location.href = "/admin/login";
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-night/95 px-4 backdrop-blur lg:hidden">
        <span className="heading-spaced text-[13px]">{siteName}</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2"><MenuIcon /></button>
      </div>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 border-r border-line bg-paper lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-line bg-paper">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-2 top-3 z-10 p-2"><CloseIcon /></button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
