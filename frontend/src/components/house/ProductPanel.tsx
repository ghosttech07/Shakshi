"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useCatalog } from "@/lib/catalog-context";
import { useStore } from "@/lib/store";
import { priceFor, type Accessory, type Product } from "@shakshi/shared/products";
import { EASE, cn, formatINR } from "@shakshi/shared/utils";
import { Stars } from "@/components/ui/Bits";
import { IconClose, IconArrow } from "@/components/ui/Icons";

export type PanelKind = "mattresses" | "pillows" | "covers";

const TITLES: Record<PanelKind, { title: string; all: string; href: string }> = {
  mattresses: { title: "Mattresses", all: "All mattresses", href: "/shop" },
  pillows: { title: "Pillows", all: "All pillows", href: "/shop/pillows" },
  covers: { title: "Mattress Covers", all: "All covers", href: "/shop/covers" },
};

/** Clean studio shot of each mattress on white where we have one, the product photo otherwise. */
const packshot = (p: Product) => `/house/packshots/${p.slug}.webp`;

function MattressCard({ p, index, here }: { p: Product; index: number; here?: boolean }) {
  const [src, setSrc] = useState(packshot(p));
  return (
    <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.06, ease: EASE }} className="group relative flex flex-col">
      <Link href={`/mattress/${p.slug}`} className="relative block aspect-[5/4] overflow-hidden rounded-sm bg-[#f6f5f2]">
        <Image src={src} alt={p.name} data-keep-bright fill sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 90vw" className="object-contain p-4 transition-transform duration-700 ease-silk group-hover:scale-[1.04]" onError={() => setSrc(p.images[0])} />
        {here ? (
          <span className="absolute left-3 top-3 rounded-sm bg-[#1c1c1c] px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white">In this room</span>
        ) : p.badge && <span className="absolute left-3 top-3 rounded-sm bg-[#e4463b] px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white">{p.badge}</span>}
      </Link>
      <div className="mt-3 flex items-center gap-2">
        <Stars value={p.rating} size={12} />
        <span className="text-xs text-[#8a8a8a]">{p.rating.toFixed(1)} · {p.reviewCount.toLocaleString("en-IN")}</span>
      </div>
      <Link href={`/mattress/${p.slug}`} className="mt-1.5 font-medium text-[#1c1c1c] hover:text-[#b8925a]">{p.name}</Link>
      <p className="mt-1 text-sm text-[#e4463b]">from {formatINR(priceFor(p, "single"))}</p>
    </motion.article>
  );
}

function AccessoryCard({ a, index }: { a: Accessory; index: number }) {
  const addToCart = useStore((s) => s.addToCart);
  return (
    <motion.article initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.06, ease: EASE }} className="group flex flex-col">
      <div className="relative aspect-[5/4] overflow-hidden rounded-sm bg-[#f6f5f2]">
        <Image src={a.image} alt={a.name} data-keep-bright fill sizes="(min-width:1280px) 22vw, (min-width:768px) 30vw, 90vw" className="object-cover transition-transform duration-700 ease-silk group-hover:scale-[1.04]" />
      </div>
      <p className="mt-3 font-medium text-[#1c1c1c]">{a.name}</p>
      <p className="mt-0.5 text-xs text-[#8a8a8a]">{a.note}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-sm text-[#e4463b]">{formatINR(a.price)}</p>
        <button onClick={() => addToCart({ key: a.id, kind: "accessory", ref: a.id, name: a.name, detail: a.note, image: a.image, price: a.price })} className="border border-[#1c1c1c] px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#1c1c1c] transition-colors hover:bg-[#1c1c1c] hover:text-white">
          Add to bag
        </button>
      </div>
    </motion.article>
  );
}

/** The list that opens over the bedroom when the visitor clicks the mattress, the pillows or the bedding. */
export function ProductPanel({ kind, onClose, featured }: { kind: PanelKind | null; onClose: () => void; featured?: string }) {
  const { products, accessories } = useCatalog();
  const [tab, setTab] = useState(0);
  useEffect(() => setTab(0), [kind]);
  useEffect(() => {
    if (!kind) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [kind, onClose]);

  const tabs = kind === "mattresses" ? ["Latest products", "Top rated", "Best sellers"] : ["All", "Price: low to high", "Price: high to low"];
  const mattresses = useMemo(() => {
    const list = [...products];
    if (tab === 1) list.sort((a, b) => b.rating - a.rating);
    if (tab === 2) list.sort((a, b) => b.reviewCount - a.reviewCount);
    // The mattress on the bed in this room leads the list
    const i = tab === 0 ? list.findIndex((p) => p.slug === featured) : -1;
    if (i > 0) list.unshift(...list.splice(i, 1));
    return list;
  }, [products, tab, featured]);
  const items = useMemo(() => {
    const k = kind === "pillows" ? "pillow" : "cover";
    const list = accessories.filter((a) => a.kind === k);
    if (tab === 1) list.sort((a, b) => a.price - b.price);
    if (tab === 2) list.sort((a, b) => b.price - a.price);
    return list;
  }, [accessories, kind, tab]);

  return (
    <AnimatePresence>
      {kind && (
        <motion.div key="panel" className="fixed inset-0 z-[70] flex items-end justify-center bg-black/35 backdrop-blur-[2px] sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={TITLES[kind].title}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.55, ease: EASE }}
            className="relative max-h-[88svh] w-full overflow-y-auto bg-white px-5 pb-8 pt-6 text-[#1c1c1c] shadow-2xl sm:w-[min(94vw,1500px)] sm:rounded-sm sm:px-10 sm:pb-10 sm:pt-8"
          >
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
              <h2 className="font-serif text-3xl sm:text-4xl">{TITLES[kind].title}</h2>
              <nav className="order-3 flex w-full gap-6 overflow-x-auto sm:order-none sm:w-auto" aria-label="Sort">
                {tabs.map((t, i) => (
                  <button key={t} onClick={() => setTab(i)} className={cn("whitespace-nowrap border-b-2 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] transition-colors", tab === i ? "border-[#e4463b] text-[#1c1c1c]" : "border-transparent text-[#9a9a9a] hover:text-[#1c1c1c]")}>
                    {t}
                  </button>
                ))}
              </nav>
              <div className="flex items-center gap-3">
                <Link href={TITLES[kind].href} className="hidden items-center gap-2 border border-[#1c1c1c] px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] hover:bg-[#1c1c1c] hover:text-white sm:inline-flex">
                  {TITLES[kind].all} <IconArrow size={13} />
                </Link>
                <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full border border-black/15 hover:bg-black/5">
                  <IconClose size={18} />
                </button>
              </div>
            </header>
            <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
              {kind === "mattresses" ? mattresses.map((p, i) => <MattressCard key={p.slug} p={p} index={i} here={p.slug === featured} />) : items.map((a, i) => <AccessoryCard key={a.id} a={a} index={i} />)}
            </div>
            <Link href={TITLES[kind].href} className="mt-9 flex items-center justify-center gap-2 border border-[#1c1c1c] py-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] hover:bg-[#1c1c1c] hover:text-white sm:hidden">
              {TITLES[kind].all} <IconArrow size={13} />
            </Link>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
