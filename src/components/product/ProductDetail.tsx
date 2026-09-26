"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ADDONS, SIZES, PRODUCTS, priceFor, getProduct, type AddonId, type Product, type SizeId } from "@/lib/products";
import { IMG } from "@/lib/images";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { mattressItem, addonItem } from "@/lib/cart-helpers";
import { EASE, cn, emiFrom, formatINR } from "@/lib/utils";
import { FirmnessScale, Stars } from "@/components/ui/Bits";
import { Img } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { SizePicker } from "@/components/commerce/SizePicker";
import { ProductCard } from "@/components/commerce/ProductCard";
import { TrustBadges } from "@/components/commerce/CartDrawer";
import { Gallery } from "./Gallery";
import { DeliveryEstimator } from "./DeliveryEstimator";
import { Reviews } from "./Reviews";
import { IconCheck, IconHeart, IconPlus } from "@/components/ui/Icons";

const ADDON_IMAGES: Record<AddonId, string> = { pillows: IMG.pillowWhite, protector: IMG.linen, frame: IMG.platform, removal: IMG.classic };

const TABS = ["Materials", "Dimensions", "Care", "Delivery & Trial", "Reviews"] as const;
type Tab = (typeof TABS)[number];

function Tabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<Tab>("Materials");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" ? (i + 1) % TABS.length : e.key === "ArrowLeft" ? (i - 1 + TABS.length) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next]);
    refs.current[next]?.focus();
  };
  const total = product.layers.reduce((a, l) => a + l.depth, 0);

  return (
    <section id="details" className="container-lux py-20 lg:py-28" aria-label="Product details">
      <div role="tablist" aria-label="Product information" className="no-scrollbar -mx-5 flex gap-8 overflow-x-auto border-b border-ink/10 px-5 sm:mx-0 sm:px-0">
        {TABS.map((t, i) => (
          <button
            key={t}
            ref={(el) => void (refs.current[i] = el)}
            role="tab"
            id={`tab-${i}`}
            aria-selected={tab === t}
            aria-controls={`panel-${i}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn("relative shrink-0 pb-4 font-serif text-xl transition-colors duration-700 sm:text-2xl", tab === t ? "text-ink" : "text-ink/40 hover:text-ink/70")}
          >
            {t}
            {t === "Reviews" && <span className="ml-1.5 align-top font-sans text-xs text-stone">{product.reviewCount.toLocaleString("en-IN")}</span>}
            {tab === t && <motion.span layoutId="tab-underline" className="absolute inset-x-0 -bottom-px h-px bg-gold-ink" transition={{ duration: 0.8, ease: EASE }} />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          role="tabpanel"
          id={`panel-${TABS.indexOf(tab)}`}
          aria-labelledby={`tab-${TABS.indexOf(tab)}`}
          tabIndex={0}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="pt-12 focus:outline-none"
        >
          {tab === "Materials" && (
            <ol className="grid gap-x-16 lg:grid-cols-2">
              {product.layers.map((l, i) => (
                <li key={l.name} className="grid grid-cols-[3rem_1fr_auto] items-start gap-4 border-b border-ink/10 py-6">
                  <span className="font-serif text-2xl text-gold-ink">0{i + 1}</span>
                  <div>
                    <p className="font-serif text-2xl">{l.name}</p>
                    <p className="mt-1 text-sm text-stone">{l.material}</p>
                    <p className="mt-2 text-sm">{l.benefit}</p>
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-sm">{l.depth} cm</p>
                    <div className="mt-2 h-1 bg-ink/10">
                      <motion.div className="h-1 bg-gold" initial={{ width: 0 }} animate={{ width: `${(l.depth / total) * 100}%` }} transition={{ duration: 1.2, delay: i * 0.1, ease: EASE }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {tab === "Dimensions" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <caption className="sr-only">Mattress dimensions and prices by size</caption>
                <thead>
                  <tr className="eyebrow text-stone">
                    <th scope="col" className="pb-4 font-semibold">Size</th>
                    <th scope="col" className="pb-4 font-semibold">Width × Length</th>
                    <th scope="col" className="pb-4 font-semibold">Height</th>
                    <th scope="col" className="pb-4 font-semibold">Weight</th>
                    <th scope="col" className="pb-4 text-right font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map((s) => (
                    <tr key={s.id} className="border-t border-ink/10">
                      <th scope="row" className="py-4 font-serif text-xl font-normal">{s.label}</th>
                      <td>{s.dims}</td>
                      <td>{product.height} cm</td>
                      <td>{Math.round((s.cm[0] * s.cm[1] * product.height) / 16500)} kg</td>
                      <td className="text-right">{formatINR(priceFor(product, s.id))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-6 text-sm text-stone">Custom sizes can be made to order in our atelier. Ask your concierge.</p>
            </div>
          )}
          {tab === "Care" && (
            <div className="grid gap-10 md:grid-cols-3">
              {[
                ["Turn with the seasons", "Rotate head-to-foot every three months in the first year, then twice a year. Your mattress will settle evenly and last beautifully."],
                ["Let it breathe", "Air your mattress by folding back the bedding for an hour each week. Natural fibres love fresh air and a little sunlight."],
                ["Protect, gently", "Use our Silk Protector and spot-clean with cool water and a mild soap. Never soak, steam or dry-clean the cover."],
              ].map(([t, b]) => (
                <div key={t}>
                  <p className="font-serif text-2xl">{t}</p>
                  <p className="mt-3 text-sm leading-relaxed text-stone">{b}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "Delivery & Trial" && (
            <div className="grid gap-10 md:grid-cols-3">
              {[
                ["Complimentary white-glove delivery", "Our two-person team carries your mattress to your room, sets it up, dresses it if you wish, and takes every scrap of packaging away. Metro cities in 3–5 days."],
                ["100 nights to decide", "Sleep on it for a full season. After 21 nights, if it isn't right, we collect it from your home and refund you in full. No questions, no fuss."],
                ["A decade of nights", "Every Shakshi is covered by a 10-year warranty against sagging deeper than 2.5 cm and any manufacturing flaw."],
              ].map(([t, b]) => (
                <div key={t}>
                  <p className="font-serif text-2xl">{t}</p>
                  <p className="mt-3 text-sm leading-relaxed text-stone">{b}</p>
                </div>
              ))}
            </div>
          )}
          {tab === "Reviews" && <Reviews product={product} />}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

function StickyBar({ product, size, total, onAdd, visible }: { product: Product; size: SizeId; total: number; onAdd: () => void; visible: boolean }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (visible) document.documentElement.setAttribute("data-dock", "bar");
    else document.documentElement.removeAttribute("data-dock");
    return () => document.documentElement.removeAttribute("data-dock");
  }, [visible]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="glass fixed inset-x-0 bottom-0 z-50 border-x-0 border-b-0 shadow-[0_-20px_60px_-30px_rgb(14_20_32/0.35)]"
          initial={{ y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
          transition={{ duration: 0.9, ease: EASE }}
          role="region"
          aria-label="Quick add to bag"
        >
          <div className="container-lux flex items-center gap-4 py-3">
            <Img src={product.images[0]} alt="" sizes="56px" wrapperClassName="hidden h-14 w-14 shrink-0 sm:block" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-lg leading-tight sm:text-xl">{product.name}</p>
              <p className="truncate text-xs text-stone">
                {SIZES.find((s) => s.id === size)!.label} · {product.firmnessLabel}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="font-serif text-2xl">{formatINR(total)}</p>
              <p className="text-[0.7rem] text-stone">or {formatINR(emiFrom(total))}/mo</p>
            </div>
            <button className="btn btn-gold !px-5 sm:!px-8" onClick={onAdd}>
              <span className="sm:hidden">{formatINR(total)} ·</span> Add to bag
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ProductDetail({ product }: { product: Product }) {
  const hydrated = useHydrated();
  const [size, setSize] = useState<SizeId>("queen");
  const [addons, setAddons] = useState<AddonId[]>([]);
  const [added, setAdded] = useState(false);
  const [sticky, setSticky] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const addToCart = useStore((s) => s.addToCart);
  const pushRecent = useStore((s) => s.pushRecent);
  const recent = useStore((s) => s.recent);
  const wished = useStore((s) => s.wishlist.includes(product.slug));
  const toggleWishlist = useStore((s) => s.toggleWishlist);

  useEffect(() => {
    if (hydrated) pushRecent(product.slug);
  }, [hydrated, product.slug, pushRecent]);

  useEffect(() => {
    if (!buyRef.current) return;
    const io = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(buyRef.current);
    return () => io.disconnect();
  }, []);

  const base = priceFor(product, size);
  const addonTotal = ADDONS.filter((a) => addons.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const total = base + addonTotal;

  const add = () => {
    addToCart(mattressItem(product, size));
    addons.forEach((id) => addToCart(addonItem(id, ADDON_IMAGES[id]), false));
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const recentProducts = hydrated ? recent.filter((s) => s !== product.slug).map((s) => getProduct(s)).filter((p): p is Product => !!p).slice(0, 4) : [];
  const alsoLove = PRODUCTS.filter((p) => p.slug !== product.slug && !recentProducts.includes(p)).slice(0, 3);

  return (
    <>
      <div className="container-lux pt-28 lg:pt-32">
        <nav aria-label="Breadcrumb" className="text-xs text-stone">
          <ol className="flex gap-2">
            <li><Link href="/" className="hover:text-ink">Home</Link> /</li>
            <li><Link href="/shop" className="hover:text-ink">Mattresses</Link> /</li>
            <li aria-current="page" className="text-ink">{product.name}</li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <Gallery product={product} size={size} />

          <div>
            <p className="eyebrow text-gold-ink">{product.tier} · {product.feeling}</p>
            <h1 className="display mt-4 text-5xl sm:text-6xl">{product.name}</h1>
            <a href="#details" className="mt-4 flex items-center gap-2 text-sm text-stone hover:text-ink">
              <Stars value={product.rating} size={14} /> {product.rating.toFixed(1)} · {product.reviewCount.toLocaleString("en-IN")} reviews
            </a>
            <p className="mt-6 font-serif text-2xl italic leading-snug text-ink/85">{product.tagline}</p>
            <p className="mt-4 leading-relaxed text-stone">{product.description}</p>

            <div className="mt-8">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="eyebrow text-stone">Firmness</p>
                <p className="text-sm">{product.firmnessLabel} · {product.firmness}/10</p>
              </div>
              <FirmnessScale value={product.firmness} />
            </div>

            <div className="mt-8">
              <SizePicker product={product} value={size} onChange={setSize} />
            </div>

            <fieldset className="mt-8">
              <legend className="eyebrow text-stone">Complete your bed</legend>
              <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
                {ADDONS.map((a) => {
                  const on = addons.includes(a.id);
                  return (
                    <li key={a.id}>
                      <label className="flex cursor-pointer items-center gap-4 py-3.5">
                        <input type="checkbox" className="peer sr-only" checked={on} onChange={() => setAddons(on ? addons.filter((x) => x !== a.id) : [...addons, a.id])} />
                        <span className={cn("grid h-5 w-5 shrink-0 place-items-center border transition-colors duration-500 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-gold", on ? "border-midnight bg-midnight text-pearl" : "border-ink/30")}>
                          {on ? <IconCheck size={13} /> : <IconPlus size={12} className="text-ink/40" />}
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm">{a.name}</span>
                          <span className="block text-xs text-stone">{a.note}</span>
                        </span>
                        <span className="text-sm">{formatINR(a.price)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            <div ref={buyRef} className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow text-stone">Total</p>
                  <motion.p key={total} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="font-serif text-4xl" aria-live="polite">
                    {formatINR(total)}
                  </motion.p>
                  {addonTotal > 0 && <p className="text-xs text-stone">Mattress {formatINR(base)} + add-ons {formatINR(addonTotal)}</p>}
                </div>
                <p className="text-right text-xs text-stone">
                  or <strong className="text-sm font-semibold text-ink">{formatINR(emiFrom(total))}/mo</strong>
                  <br />
                  12 months, no-cost EMI
                </p>
              </div>
              <div className="mt-5 flex gap-3">
                <button className="btn btn-gold flex-1" onClick={add}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={added ? "a" : "b"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2">
                      {added ? <><IconCheck size={16} /> Added to your bag</> : "Add to bag"}
                    </motion.span>
                  </AnimatePresence>
                </button>
                <button
                  onClick={() => toggleWishlist(product.slug)}
                  aria-pressed={hydrated && wished}
                  aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
                  className="grid w-14 shrink-0 place-items-center border border-ink/15 transition-colors duration-700 hover:border-gold"
                >
                  <IconHeart size={20} filled={hydrated && wished} className={hydrated && wished ? "text-gold-ink" : ""} />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <DeliveryEstimator />
            </div>
            <div className="mt-8">
              <TrustBadges />
            </div>
          </div>
        </div>
      </div>

      <section className="mt-24 bg-midnight text-pearl linen-dark lg:mt-32" aria-labelledby="feeling-title">
        <div className="container-lux grid items-center gap-12 py-20 lg:grid-cols-2 lg:gap-24 lg:py-28">
          <Reveal>
            <Img src={product.images[1]} alt={`${product.name} styled in a calm bedroom`} sizes="(min-width: 1024px) 45vw, 100vw" dark wrapperClassName="aspect-[4/3]" />
          </Reveal>
          <div>
            <Reveal><p className="eyebrow text-gold">The feeling</p></Reveal>
            <Reveal delay={0.1}>
              <h2 id="feeling-title" className="display mt-5 text-5xl lg:text-6xl">
                <em className="text-gold-soft">{product.feeling}.</em> Night after night.
              </h2>
            </Reveal>
            <ul className="mt-10 space-y-5">
              {product.highlights.map((h, i) => (
                <Reveal as="li" key={h} delay={0.2 + i * 0.1} className="flex items-center gap-5 border-t border-pearl/10 pt-5 text-lg">
                  <span className="font-serif text-gold">0{i + 1}</span> {h}
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Tabs product={product} />

      {recentProducts.length > 0 && (
        <section className="container-lux pb-16" aria-labelledby="recent-title">
          <h2 id="recent-title" className="eyebrow text-stone">Recently viewed</h2>
          <ul className="no-scrollbar mt-6 flex gap-4 overflow-x-auto">
            {recentProducts.map((p) => (
              <li key={p.slug} className="w-60 shrink-0">
                <Link href={`/mattress/${p.slug}`} className="group block">
                  <Img src={p.images[0]} alt="" sizes="240px" wrapperClassName="aspect-[4/3]" className="transition-transform duration-1000 ease-silk group-hover:scale-105" />
                  <p className="mt-3 font-serif text-xl">{p.name}</p>
                  <p className="text-xs text-stone">from {formatINR(p.basePrice)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-lux pb-28" aria-labelledby="also-title">
        <div className="gold-rule mb-16" />
        <h2 id="also-title" className="display text-4xl lg:text-5xl">You may also <em>love</em></h2>
        <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {alsoLove.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>

      <StickyBar product={product} size={size} total={total} onAdd={add} visible={sticky} />
    </>
  );
}
