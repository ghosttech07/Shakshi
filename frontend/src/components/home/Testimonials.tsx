"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { TESTIMONIALS } from "@shakshi/shared/products";
import { EASE } from "@shakshi/shared/utils";
import { Img } from "@/components/ui/Img";
import { Stars } from "@/components/ui/Bits";
import { IconArrow, IconArrowLeft } from "@/components/ui/Icons";

function ScoreRing({ before, after }: { before: number; after: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth="2" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="#a89f94" strokeWidth="2" strokeDasharray={`${(before / 100) * c} ${c}`} />
        <motion.circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="#c9a96e"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (after / 100) * c }}
          transition={{ duration: 2, delay: 0.4, ease: EASE }}
        />
      </svg>
      <div>
        <p className="eyebrow text-stone">Sleep score</p>
        <p className="mt-1 font-serif text-4xl">
          {after}
          <span className="ml-2 text-base text-gold-ink">+{after - before}</span>
        </p>
        <p className="text-xs text-stone">from {before} before Shakshi</p>
      </div>
    </div>
  );
}

export function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const n = TESTIMONIALS.length;
  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);

  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => go(1), 8000);
    return () => clearInterval(t);
  }, [paused, reduce, go]);

  const t = TESTIMONIALS[i];

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
        <p className="eyebrow text-gold-ink">Sleepers, in their own words</p>
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="relative aspect-[4/5] max-h-[560px] overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={t.name}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: reduce ? 1 : 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: EASE }}
              >
                <Img src={t.image} alt={`Portrait of ${t.name}`} sizes="(min-width: 1024px) 40vw, 100vw" wrapperClassName="absolute inset-0" />
              </motion.div>
            </AnimatePresence>
          </div>

          <div aria-live={paused ? "polite" : "off"}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: reduce ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -12 }}
                transition={{ duration: 0.9, ease: EASE }}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${n}`}
              >
                <Stars value={t.rating} size={16} />
                <blockquote className="mt-6 font-serif text-3xl font-light leading-snug sm:text-4xl lg:text-[2.8rem]">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-lg">{t.name}</p>
                    <p className="text-sm text-stone">
                      {t.city} · sleeps on {t.product}
                    </p>
                  </div>
                  <ScoreRing before={t.before} after={t.after} />
                </figcaption>
              </motion.figure>
            </AnimatePresence>

            <div className="mt-12 flex items-center gap-6">
              <button onClick={() => go(-1)} aria-label="Previous testimonial" className="grid h-12 w-12 place-items-center rounded-full border border-ink/20 transition-colors duration-700 hover:border-gold">
                <IconArrowLeft size={18} />
              </button>
              <button onClick={() => go(1)} aria-label="Next testimonial" className="grid h-12 w-12 place-items-center rounded-full border border-ink/20 transition-colors duration-700 hover:border-gold">
                <IconArrow size={18} />
              </button>
              <div className="ml-2 flex gap-2">
                {TESTIMONIALS.map((x, k) => (
                  <button key={x.name} onClick={() => setI(k)} aria-label={`Show testimonial ${k + 1}`} aria-current={k === i} className="group grid h-6 place-items-center">
                    <span className={`block h-px transition-all duration-1000 ease-silk ${k === i ? "w-10 bg-gold-ink" : "w-5 bg-ink/25 group-hover:bg-ink/50"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
