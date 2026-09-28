"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./Logo";

type Item = { href: string; label: string; icon: ReactNode };
const i = (d: string) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);

const GROUPS: { title: string; items: Item[] }[] = [
  { title: "", items: [{ href: "", label: "Dashboard", icon: i("M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z") }] },
  {
    title: "Sales",
    items: [
      { href: "/orders", label: "Orders", icon: i("M6 7h12l-1 13H7zM9 7a3 3 0 0 1 6 0") },
      { href: "/carts", label: "Unfinished checkouts", icon: i("M3 4h2l2.4 11h10.2L20 8H6.2M9 20h.01M17 20h.01") },
      { href: "/discounts", label: "Discount codes", icon: i("M20 12l-8 8-9-9V4h7zM7.5 7.5h.01") },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/products", label: "Mattresses", icon: i("M3 16h18v3H3zM5 16v-5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5M8 9V7h8v2") },
      { href: "/pillows-covers", label: "Pillows & covers", icon: i("M4 8c0-2 2-3 8-3s8 1 8 3v8c0 2-2 3-8 3s-8-1-8-3zM4 12h16") },
    ],
  },
  {
    title: "Customers",
    items: [
      { href: "/customers", label: "Customers", icon: i("M16 19a4 4 0 0 0-8 0M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6") },
      { href: "/reviews", label: "Reviews", icon: i("M12 4l2.4 5 5.3.6-4 3.7 1.1 5.3L12 16l-4.8 2.6 1.1-5.3-4-3.7 5.3-.6z") },
      { href: "/bookings", label: "Bookings", icon: i("M5 6h14v14H5zM5 10h14M9 4v4M15 4v4") },
      { href: "/inquiries", label: "Messages", icon: i("M4 6h16v12H4zM4 7l8 6 8-6") },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/pages", label: "Pages", icon: i("M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5") },
      { href: "/library", label: "Sleep Library", icon: i("M5 4h5a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5zM19 4h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h5z") },
      { href: "/media", label: "Photos & files", icon: i("M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01") },
      { href: "/site", label: "Settings", icon: i("M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2.5-1.5H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9zM7.5 11h.01M10 7h.01M14.5 7h.01") },
    ],
  },
];

/** Strips whichever prefix the path arrived with (the private address, or the internal one). */
const relative = (path: string, base: string) => {
  for (const p of [base, "/studio-internal"]) if (path === p || path.startsWith(`${p}/`)) return path.slice(p.length) || "";
  return path;
};

export function Shell({ base, storefront, children }: { base: string; storefront: string; children: ReactNode }) {
  const path = relative(usePathname(), base);
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => (href === "" ? path === "" || path === "/" : path === href || path.startsWith(`${href}/`));

  const nav = (
    <nav aria-label="Studio" className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <Link href={base} className="text-pearl" aria-label="Studio overview">
          <Logo className="h-6" />
        </Link>
        <span className="text-xs font-semibold text-gold/80">Admin</span>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {GROUPS.map((g) => (
          <div key={g.title || "main"}>
            {g.title && <p className="px-3 pb-1.5 text-xs font-semibold text-pearl/40">{g.title}</p>}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const on = active(it.href);
                return (
                  <li key={it.href}>
                    <Link
                      href={`${base}${it.href}`}
                      aria-current={on ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-md px-3 py-[0.4rem] text-[0.9rem] transition-colors duration-300 ${on ? "bg-gold/15 text-gold" : "text-pearl/70 hover:bg-pearl/5 hover:text-pearl"}`}
                    >
                      <span className={on ? "text-gold" : "text-pearl/45"}>{it.icon}</span>
                      {it.label}
                      {on && <span aria-hidden className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-pearl/10 p-3">
        <a href={storefront} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[0.85rem] text-pearl/70 hover:text-pearl">
          View the website ↗
        </a>
        <Link href={`${base}/audit`} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[0.85rem] text-pearl/50 hover:text-pearl">
          Activity & sign-ins
        </Link>
        <form action="/api/admin/logout" method="post">
          <button className="w-full rounded-md border border-pearl/15 px-3 py-2 text-left text-[0.85rem] text-pearl/80 transition-colors hover:border-gold hover:text-gold">Sign out</button>
        </form>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-midnight lg:block">{nav}</aside>

      {/* Phones and tablets: a top bar and a drawer */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-midnight px-4 text-pearl lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="-ml-2 grid h-10 w-10 place-items-center">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Logo className="h-5" />
        <span className="text-xs font-semibold text-gold/80">Admin</span>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-midnight/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-midnight shadow-2xl">{nav}</div>
        </div>
      )}

      <main id="main" className="min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
