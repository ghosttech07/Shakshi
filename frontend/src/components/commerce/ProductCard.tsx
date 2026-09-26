"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { priceFor, type Product, type SizeId } from "@shakshi/shared/products";
import { EASE, cn, formatINR } from "@shakshi/shared/utils";
import { FirmnessScale, Stars } from "@/components/ui/Bits";
import { IconHeart, IconEye, IconCheck } from "@/components/ui/Icons";

type Props = { product: Product; index?: number; showCompare?: boolean; priority?: boolean; size?: SizeId };

export function ProductCard({ product: p, index = 0, showCompare, priority, size }: Props) {
  const price = size ? priceFor(p, size) : p.basePrice;
  const reduce = useReducedMotion();
  const hydrated = useHydrated();
  const wished = useStore((s) => s.wishlist.includes(p.slug));
  const comparing = useStore((s) => s.compare.includes(p.slug));
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const setQuickView = useStore((s) => s.setQuickView);
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.article
      className="group relative flex flex-col"
      initial={{ opacity: 0, y: reduce ? 0 : 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 1.1, delay: (index % 4) * 0.12, ease: EASE }}
    >
      <div className={cn("relative aspect-[4/5] overflow-hidden bg-ivory-2 shadow-none transition-shadow duration-1000 ease-silk group-hover:shadow-lift", !loaded && "skeleton")}>
        <Link href={`/mattress/${p.slug}`} aria-label={`${p.name}, ${p.firmnessLabel}, from ${formatINR(price)}`} className="absolute inset-0 z-[1]">
          <Image
            src={p.images[0]}
            alt={`${p.name} dressed in a serene bedroom`}
            fill
            preload={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            onLoad={() => setLoaded(true)}
            className={cn(
              "object-cover transition-[opacity,transform] duration-[1400ms] ease-silk group-hover:scale-[1.04] group-hover:opacity-0",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
          <Image
            src={p.images[1]}
            alt=""
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="scale-[1.06] object-cover opacity-0 transition-[opacity,transform] duration-[1400ms] ease-silk group-hover:scale-100 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-transparent to-transparent opacity-80" />
        </Link>

        {p.badge && <span className="glass absolute left-4 top-4 z-[2] px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-ink">{p.badge}</span>}

        <div className="absolute right-3 top-3 z-[2] flex flex-col gap-2">
          <button
            onClick={() => toggleWishlist(p.slug)}
            aria-pressed={hydrated && wished}
            aria-label={wished ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
            className="glass grid h-10 w-10 place-items-center rounded-full text-ink transition-transform duration-700 ease-silk hover:scale-110"
          >
            <IconHeart size={18} filled={hydrated && wished} className={hydrated && wished ? "text-gold-ink" : ""} />
          </button>
          <button
            onClick={() => setQuickView(p.slug)}
            aria-label={`Quick view ${p.name}`}
            className="glass grid h-10 w-10 place-items-center rounded-full text-ink transition-[transform,opacity] duration-700 ease-silk hover:scale-110 lg:translate-x-2 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
          >
            <IconEye size={18} />
          </button>
        </div>

        {/* Hover reveal: firmness + key features */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[2] hidden translate-y-4 opacity-0 transition-[opacity,transform] duration-1000 ease-silk group-hover:translate-y-0 group-hover:opacity-100 lg:block">
          <div className="glass-dark p-5 text-pearl">
            <p className="eyebrow text-gold">{p.firmnessLabel} · {p.firmness}/10</p>
            <div className="mt-3">
              <FirmnessScale value={p.firmness} dark compact />
            </div>
            <ul className="mt-4 space-y-1.5 text-[0.8rem] text-pearl/80">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-2">
                  <span className="mt-2 h-px w-3 shrink-0 bg-gold" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="absolute bottom-5 left-5 z-[2] font-serif text-lg italic text-pearl transition-opacity duration-700 lg:group-hover:opacity-0">{p.feeling}</p>
      </div>

      <div className="flex flex-1 flex-col pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-2xl">
            <Link href={`/mattress/${p.slug}`} className="link-lux">
              {p.name}
            </Link>
          </h3>
          <p className="shrink-0 text-sm text-stone">{size ? "" : "from "}{formatINR(price)}</p>
        </div>
        <p className="mt-1.5 text-sm text-stone">{p.tagline}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-stone">
          <Stars value={p.rating} size={12} /> {p.rating.toFixed(1)} · {p.reviewCount.toLocaleString("en-IN")} reviews
        </div>
        <div className="mt-4 lg:hidden">
          <FirmnessScale value={p.firmness} compact />
        </div>
        {showCompare && (
          <label className="mt-4 inline-flex cursor-pointer items-center gap-3 self-start text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">
            <input type="checkbox" className="peer sr-only" checked={hydrated && comparing} onChange={() => toggleCompare(p.slug)} />
            <span className="grid h-4 w-4 place-items-center border border-ink/30 transition-colors duration-500 peer-checked:border-midnight peer-checked:bg-midnight peer-checked:text-pearl peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-gold">
              {hydrated && comparing && <IconCheck size={12} />}
            </span>
            Compare
          </label>
        )}
      </div>
    </motion.article>
  );
}
