"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE, cn } from "@shakshi/shared/utils";
import { IconArrow } from "@/components/ui/Icons";
import { useLoad3D } from "@/lib/use3d";
import { useNight } from "@/lib/theme";
import { useHydrated } from "@/lib/useHydrated";
import { useAccount } from "@/lib/account";
import { useCatalog } from "@/lib/catalog-context";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), { ssr: false });

function Headline({ words, reduce, className }: { words: string[]; reduce: boolean; className?: string }) {
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={w} className="block overflow-hidden pb-2">
          <motion.span
            className={`block ${i === words.length - 1 ? "italic text-gold-ink" : ""}`}
            initial={{ y: reduce ? 0 : "110%", opacity: reduce ? 0 : 1 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.45 + i * 0.18, ease: EASE }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** "Welcome back." Uses what the visitor told us: their name, or their quiz match. */
function Greeting() {
  const hydrated = useHydrated();
  const profile = useAccount((s) => s.profile);
  const quiz = useAccount((s) => s.quiz);
  const { get } = useCatalog();
  const match = quiz ? get(quiz.match) : undefined;
  if (!hydrated || (!profile && !match)) return null;
  const first = profile?.name.split(" ")[0];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 1.6, ease: EASE }} className="mt-8">
      <Link href={match ? `/mattress/${match.slug}` : "/account"} className="glass group inline-flex items-center gap-3 rounded-full py-2.5 pl-4 pr-3 text-sm text-ink shadow-soft">
        <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
        <span>
          Welcome back{first ? `, ${first}` : ""}.{" "}
          {match ? (
            <>
              Your match, <strong className="font-semibold">{match.name.replace("The ", "the ")}</strong>, is waiting.
            </>
          ) : (
            "Your account is ready when you are."
          )}
        </span>
        <IconArrow size={14} className="transition-transform duration-700 ease-silk group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = !!useReducedMotion();
  const night = useNight();
  const { go, policy } = useLoad3D(ref);
  const [inView, setInView] = useState(true);
  const [ready, setReady] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  // Desktop shows an undressed bed until the scene arrives, so the duvet can fall onto it.
  // Everywhere else the poster is already dressed, and the scene fades in settled.
  const fall = policy === "full" && !reduce;

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] overflow-hidden" aria-labelledby="hero-title">
      <div className="hero-sky absolute inset-0" aria-hidden />
      <div aria-hidden className="day-only absolute -left-1/4 -top-1/4 h-[130%] w-[70%] rotate-[18deg] bg-[linear-gradient(90deg,transparent,rgb(255_248_235/0.55),transparent)] blur-3xl motion-safe:animate-breathe" />
      <div aria-hidden className="night-only absolute -left-1/4 -top-1/4 h-[130%] w-[60%] rotate-[18deg] bg-[linear-gradient(90deg,transparent,rgb(170_190_235/0.12),transparent)] blur-3xl motion-safe:animate-breathe" />

      <motion.div style={{ y: sceneY }} className="absolute inset-0">
        <div className={cn("hero-poster absolute inset-0 transition-opacity duration-[1600ms] ease-silk", ready && "opacity-0")} data-dressed={(policy !== null && !fall) || undefined} aria-hidden />
        {go && (
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 1.6, ease: EASE }}>
            <HeroScene active={inView} night={night} mode={fall ? "fall" : "settled"} drift={!reduce} onReady={() => setReady(true)} />
          </motion.div>
        )}
      </motion.div>

      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ivory to-transparent" />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="container-lux relative z-10 flex h-full flex-col justify-start pt-32 sm:pt-36 lg:justify-center lg:pt-0">
        <div className="max-w-xl">
          <motion.p className="eyebrow text-gold-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.3, ease: EASE }}>
            <span className="day-only">A commitment for complete rest</span>
            <span className="night-only">Good evening</span>
          </motion.p>
          <h1 id="hero-title" className="display mt-5 text-[3.6rem] text-ink sm:text-7xl lg:text-[7.5rem]">
            <Headline className="day-only block" words={["Sleep,", "Elevated."]} reduce={reduce} />
            <Headline className="night-only block" words={["Ready for", "tonight?"]} reduce={reduce} />
          </h1>
          <motion.p className="mt-6 max-w-md text-base leading-relaxed text-ink/75 sm:text-lg" initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 1, ease: EASE }}>
            <span className="day-only">Fall into something extraordinary. Mattresses shaped by hand, layered with the world&rsquo;s gentlest materials, made for the deepest kind of rest.</span>
            <span className="night-only">The lights are low and the day is done. Find the mattress that will hold you through every hour of it, until a slow and restored morning.</span>
          </motion.p>
          <motion.div className="mt-9 flex flex-wrap items-center gap-6" initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 1.2, ease: EASE }}>
            <Link href="/quiz" className="btn btn-gold shadow-soft">
              Find Your Mattress <IconArrow size={16} />
            </Link>
            <Link href="/shop" className="link-lux text-sm text-ink/80 hover:text-ink">
              Explore the collection
            </Link>
          </motion.div>
          <AnimatePresence>
            <Greeting />
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div aria-hidden className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-ink/50 sm:flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 1.5 }}>
        <span className="eyebrow text-[0.6rem]">Scroll to unwind</span>
        <span className="relative h-12 w-px overflow-hidden bg-ink/15">
          <motion.span className="absolute inset-x-0 top-0 h-1/2 bg-gold-ink" animate={reduce ? {} : { y: ["-100%", "200%"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
        </span>
      </motion.div>
    </section>
  );
}
