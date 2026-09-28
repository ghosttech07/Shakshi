"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";
import { useCallback, useEffect, useState } from "react";
import type { Review } from "@shakshi/shared/products";
import { fieldFn } from "@/components/cms/text";
import { EASE } from "@shakshi/shared/utils";
import { useCatalog } from "@/lib/catalog-context";
import { Img } from "@/components/ui/Img";
import { Stars } from "@/components/ui/Bits";
import { IconArrow, IconArrowLeft, IconCheck } from "@/components/ui/Icons";

const REFRESH_MS = 30_000;
const since = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
};

/**
 * Real reviews from real sleepers, live. Approved reviews (Reviews in the studio) appear here
 * within half a minute, newest first. Hidden until the first review is approved.
 */
export function Testimonials({ eyebrow = "Sleepers, in their own words", count = 12, minRating = 4, edit }: { eyebrow?: string; count?: number; minRating?: number; edit?: boolean }) {
  const f = fieldFn(edit);
  const { get } = useCatalog();
  const reduce = useReducedMotion();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  // Fetch now, every 30 seconds, and whenever the visitor comes back to the tab.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/reviews?limit=${count}&min=${minRating}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { reviews: Review[] };
        if (alive) setReviews(j.reviews);
      } catch {
        // Offline or the backend is away: keep what's shown.
      }
    };
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), REFRESH_MS);
    const onShow = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [count, minRating]);

  const n = reviews?.length ?? 0;
  const go = useCallback((d: number) => n && setI((v) => (v + d + n) % n), [n]);
  useEffect(() => {
    if (paused || reduce || n < 2) return;
    const t = setInterval(() => go(1), 9000);
    return () => clearInterval(t);
  }, [paused, reduce, go, n]);

  if (!reviews || !n) {
    // In the studio preview, explain the empty section instead of hiding it.
    return edit ? (
      <section className="container-lux py-16 text-center">
        <p className="eyebrow text-gold-ink" {...f("eyebrow")}>
          {eyebrow}
        </p>
        <p className="mt-3 text-stone">Customer reviews appear here, live, as soon as you approve them in Reviews.</p>
      </section>
    ) : null;
  }

  const r = reviews[i % n];
  const product = get(r.product);

  return (
    <section
      className="bg-ivory-2/50 py-24 lg:py-36"
      aria-roledescription="carousel"
      aria-label="What our sleepers say"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="container-lux">
        <p className="eyebrow flex items-center gap-2 text-gold-ink" {...f("eyebrow")}>
          {eyebrow}
          <span className="inline-flex items-center gap-1.5 text-[0.6rem] tracking-[0.2em] text-stone">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" /> Live
          </span>
        </p>
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="relative aspect-[4/5] max-h-[560px] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={r.id}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: EASE }}
              >
                {(r.photo || product?.images[0]) && <Img src={r.photo || product!.images[0]} alt={product ? `${product.name}, the mattress ${r.name} reviewed` : ""} sizes="(min-width: 1024px) 40vw, 100vw" wrapperClassName="absolute inset-0" />}
                {product && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-midnight/80 to-transparent p-6 text-pearl">
                    <span className="eyebrow text-gold">Reviewed</span>
                    <span className="mt-1 block font-serif text-2xl">{product.name}</span>
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div aria-live={paused ? "polite" : "off"}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={r.id}
                initial={{ opacity: 0, y: reduce ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -12 }}
                transition={{ duration: 0.9, ease: EASE }}
                aria-roledescription="slide"
                aria-label={`${(i % n) + 1} of ${n}`}
              >
                <Stars value={r.rating} size={16} />
                {r.title && <p className="mt-6 font-serif text-2xl text-gold-ink">{r.title}</p>}
                <blockquote className="mt-3 font-serif text-3xl font-light leading-snug sm:text-4xl lg:text-[2.6rem]">&ldquo;{r.body}&rdquo;</blockquote>
                <figcaption className="mt-8">
                  <p className="flex flex-wrap items-center gap-3 text-lg">
                    {r.name}
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-gold-ink">
                        <IconCheck size={13} /> Verified purchase
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-stone">
                    {product ? (
                      <>
                        on{" "}
                        <Link href={`/mattress/${product.slug}`} className="link-lux text-ink">
                          {product.name}
                        </Link>{" "}
                        ·{" "}
                      </>
                    ) : null}
                    {since(r.date)}
                  </p>
                </figcaption>
              </motion.figure>
            </AnimatePresence>

            {n > 1 && (
              <div className="mt-12 flex items-center gap-6">
                <button onClick={() => go(-1)} aria-label="Previous review" className="grid h-12 w-12 place-items-center rounded-full border border-ink/20 transition-colors duration-700 hover:border-gold">
                  <IconArrowLeft size={18} />
                </button>
                <button onClick={() => go(1)} aria-label="Next review" className="grid h-12 w-12 place-items-center rounded-full border border-ink/20 transition-colors duration-700 hover:border-gold">
                  <IconArrow size={18} />
                </button>
                <div className="ml-2 flex flex-wrap gap-2">
                  {reviews.map((x, k) => (
                    <button key={x.id} onClick={() => setI(k)} aria-label={`Show review ${k + 1}`} aria-current={k === i % n} className="group grid h-6 place-items-center">
                      <span className={`block h-px transition-all duration-1000 ease-silk ${k === i % n ? "w-10 bg-gold-ink" : "w-5 bg-ink/25 group-hover:bg-ink/50"}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
