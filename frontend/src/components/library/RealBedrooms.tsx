"use client";

import { useSite } from "@/lib/site-context";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { Bedroom, Hotspot } from "@shakshi/shared/bedrooms";
import { ACCESSORIES } from "@shakshi/shared/products";
import { useCatalog } from "@/lib/catalog-context";
import { useStore } from "@/lib/store";
import { mattressItem } from "@/lib/cart-helpers";
import { Dialog } from "@/components/ui/Dialog";
import { Img } from "@/components/ui/Img";
import { EASE, cn, formatINR } from "@shakshi/shared/utils";
import { IconPlus } from "@/components/ui/Icons";

function useSpot(s: Hotspot) {
  const { get } = useCatalog();
  if (s.kind === "mattress") {
    const p = get(s.ref);
    return p ? { name: p.name, price: p.basePrice, from: true, href: `/mattress/${p.slug}`, image: p.images[0], product: p } : null;
  }
  const a = ACCESSORIES.find((x) => x.id === s.ref);
  return a ? { name: a.name, price: a.price, from: false, href: undefined, image: a.image, accessory: a } : null;
}

function SpotCard({ s }: { s: Hotspot }) {
  const info = useSpot(s);
  const addToCart = useStore((st) => st.addToCart);
  if (!info) return null;
  return (
    <div className="flex items-center gap-4 border-t border-ink/10 py-4 first:border-t-0">
      <Img src={info.image} alt="" sizes="64px" wrapperClassName="h-16 w-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-serif text-xl leading-tight">{info.name}</p>
        <p className="text-xs text-stone">
          {info.from ? "from " : ""}
          {formatINR(info.price)}
        </p>
      </div>
      {info.href ? (
        <div className="flex flex-col items-end gap-1.5">
          <button className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-ink hover:text-ink" onClick={() => info.product && addToCart(mattressItem(info.product, "queen"))}>
            + Add Queen
          </button>
          <Link href={info.href} className="text-[0.65rem] uppercase tracking-[0.2em] text-stone hover:text-ink">
            View
          </Link>
        </div>
      ) : (
        <button
          className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-ink hover:text-ink"
          onClick={() => info.accessory && addToCart({ key: info.accessory.id, kind: "accessory", ref: info.accessory.id, name: info.accessory.name, detail: info.accessory.note, image: info.accessory.image, price: info.accessory.price })}
        >
          + Add
        </button>
      )}
    </div>
  );
}

function Dots({ b, active, onPick }: { b: Bedroom; active?: number; onPick?: (i: number) => void }) {
  const { get } = useCatalog();
  const label = (s: Hotspot) => (s.kind === "mattress" ? get(s.ref)?.name : ACCESSORIES.find((a) => a.id === s.ref)?.name) ?? "Product";
  return (
    <>
      {b.spots.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPick?.(i);
          }}
          aria-label={`In this photo: ${label(s)}`}
          className={cn("absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-pearl/80 bg-midnight/40 text-pearl backdrop-blur-sm transition-transform duration-700 ease-silk hover:scale-110", active === i && "scale-110 bg-gold text-midnight")}
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          <span className="absolute inset-0 animate-ping rounded-full border border-pearl/50 [animation-duration:2.6s]" aria-hidden />
          <IconPlus size={14} />
        </button>
      ))}
    </>
  );
}

export function RealBedrooms({ limit }: { limit?: number }) {
  const BEDROOMS = useSite().bedrooms as Bedroom[];
  const { products } = useCatalog();
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<Bedroom | null>(null);
  const [spot, setSpot] = useState(0);
  const list = BEDROOMS.filter((b) => filter === "all" || b.spots.some((s) => s.ref === filter)).slice(0, limit);

  return (
    <>
      {!limit && (
        <div role="tablist" aria-label="Filter by mattress" className="no-scrollbar -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <button role="tab" aria-selected={filter === "all"} data-active={filter === "all"} className="chip shrink-0" onClick={() => setFilter("all")}>
            All bedrooms
          </button>
          {products.map((p) => (
            <button key={p.slug} role="tab" aria-selected={filter === p.slug} data-active={filter === p.slug} className="chip shrink-0" onClick={() => setFilter(p.slug)}>
              {p.name.replace("The ", "")}
            </button>
          ))}
        </div>
      )}
      <motion.ul layout className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>li]:mb-5">
        <AnimatePresence>
          {list.map((b, i) => (
            <motion.li key={b.id} layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 1, delay: (i % 3) * 0.08, ease: EASE }} className="break-inside-avoid">
              <figure className="group relative overflow-hidden">
                <button type="button" onClick={() => { setOpen(b); setSpot(0); }} className="block w-full text-left" data-cursor="view" aria-label={`Shop ${b.name}'s bedroom in ${b.city}`}>
                  <span className={cn("relative block", b.tall ? "aspect-[4/5]" : "aspect-[4/3]")}>
                    <Image src={b.image} alt={b.alt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-[1600ms] ease-silk group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-transparent to-transparent" />
                  </span>
                </button>
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 [&_button]:pointer-events-auto">
                  <Dots b={b} onPick={(k) => { setOpen(b); setSpot(k); }} />
                </div>
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-pearl">
                  <p className="font-serif text-lg italic leading-snug">&ldquo;{b.caption}&rdquo;</p>
                  <p className="mt-2 text-xs text-pearl/70">
                    {b.name} · {b.city}
                  </p>
                </figcaption>
              </figure>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <Dialog open={!!open} onClose={() => setOpen(null)} title={open ? `${open.name}'s bedroom` : "Bedroom"} hideTitle className="sm:max-w-5xl">
        {open && (
          <div className="grid md:grid-cols-[1.4fr_1fr]">
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[560px]">
              <Image src={open.image} alt={open.alt} fill sizes="(min-width: 768px) 60vw, 100vw" quality={85} className="object-cover" />
              <Dots b={open} active={spot} onPick={setSpot} />
            </div>
            <div className="flex flex-col p-7 sm:p-9">
              <p className="eyebrow text-gold-ink">Real bedrooms · {open.city}</p>
              <p className="mt-4 font-serif text-3xl italic leading-snug">&ldquo;{open.caption}&rdquo;</p>
              <p className="mt-3 text-sm text-stone">{open.name}</p>
              <p className="eyebrow mt-8 text-stone">In this room</p>
              <div className="mt-2">
                {open.spots.map((s, i) => (
                  <div key={i} className={cn("transition-opacity duration-500", spot === i ? "opacity-100" : "opacity-70")}>
                    <SpotCard s={s} />
                  </div>
                ))}
              </div>
              <p className="mt-auto pt-8 text-xs text-stone">Share yours with #ShakshiNights and we&rsquo;ll send a linen pillowcase set.</p>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
