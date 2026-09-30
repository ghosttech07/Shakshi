"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { lockScroll, unlockScroll } from "@/components/layout/SmoothScroll";
import { EASE } from "@shakshi/shared/utils";
import { IntroSmoke } from "./IntroSmoke";
import { ProductPanel, type PanelKind } from "./ProductPanel";
import type { HotspotId } from "./Hotspot";

const HouseScene = dynamic(() => import("./HouseScene"), { ssr: false });

/** Room captions, shown while the camera passes through each room. */
const CAPTIONS: { from: number; to: number; eyebrow: string; title: string }[] = [
  { from: 0.0, to: 0.14, eyebrow: "Shakshi", title: "Welcome home." },
  { from: 0.44, to: 0.6, eyebrow: "The living room", title: "Where the evening slows." },
  { from: 0.63, to: 0.76, eyebrow: "The dining room", title: "Gathered, unhurried." },
  { from: 0.84, to: 0.95, eyebrow: "The bedroom", title: "Where rest begins." },
];

const SEEN = "shk-house-intro";

/**
 * The house. A logo that dissolves into smoke, then a scroll-driven walk through a villa at dusk:
 * the living room, the dining room, and into the bedroom, where everything that glows can be clicked.
 */
export function HouseExperience() {
  const router = useRouter();
  const progress = useRef(0);
  const [p, setP] = useState(0);
  const [ready, setReady] = useState(false);
  const [intro, setIntro] = useState(true);
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const [lite, setLite] = useState(false);

  // Returning visitors in the same session skip the intro
  useEffect(() => {
    setLite(matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency ?? 8) <= 4);
    try {
      if (sessionStorage.getItem(SEEN)) setIntro(false);
    } catch {}
    document.body.dataset.page = "house";
    return () => {
      delete document.body.dataset.page;
    };
  }, []);

  useEffect(() => {
    if (!intro) return;
    lockScroll();
    document.body.dataset.intro = "1";
    return () => {
      unlockScroll();
      delete document.body.dataset.intro;
    };
  }, [intro]);

  const endIntro = useCallback(() => {
    setIntro(false);
    try {
      sessionStorage.setItem(SEEN, "1");
    } catch {}
  }, []);

  // Scroll position → progress through the house
  useEffect(() => {
    let raf = 0;
    const read = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.current = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      setP(Math.round(progress.current * 200) / 200);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    read();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const arrived = p >= 0.985;
  const select = useCallback(
    (id: HotspotId) => {
      if (id === "library") return router.push("/sleep-library");
      if (id === "story") return router.push("/about");
      setPanel(id);
    },
    [router]
  );

  return (
    <div className="relative">
      {/* The house fills the whole screen; the page scrolls beneath it */}
      <div className="fixed inset-0 z-0 bg-[#0b0d12]">
        <HouseScene progress={progress} active={arrived && !panel} onSelect={select} onReady={() => setReady(true)} lite={lite} />
      </div>
      <div aria-hidden style={{ height: "900svh" }} />

      {/* Room captions */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[22svh] z-10 flex justify-center px-5">
        <AnimatePresence mode="wait">
          {!intro &&
            CAPTIONS.filter((c) => p >= c.from && p <= c.to).map((c) => (
              <motion.div key={c.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.9, ease: EASE }} className="text-center text-pearl [text-shadow:0_2px_24px_rgb(0_0_0/0.55)]">
                <p className="eyebrow text-gold-soft">{c.eyebrow}</p>
                <p className="display mt-3 text-4xl sm:text-6xl">{c.title}</p>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* First screen: invite the scroll */}
      <AnimatePresence>
        {!intro && p < 0.02 && (
          <motion.div key="cue" className="pointer-events-none fixed inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3 text-pearl/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            <span className="eyebrow text-[0.65rem]">Scroll to step inside</span>
            <span className="relative h-12 w-px overflow-hidden bg-pearl/25">
              <motion.span className="absolute inset-x-0 top-0 h-1/2 bg-gold" animate={{ y: ["-100%", "200%"] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In the bedroom: how to explore */}
      <AnimatePresence>
        {arrived && !panel && (
          <motion.p key="hint" className="pointer-events-none fixed inset-x-0 bottom-6 z-10 px-5 text-center text-sm text-pearl/85 [text-shadow:0_1px_12px_rgb(0_0_0/0.6)]" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
            Click the mattress, the pillows or the bedding to see the collection. The bookshelf and the photographs tell our story.
          </motion.p>
        )}
      </AnimatePresence>

      {/* The logo intro */}
      <AnimatePresence>
        {intro && (
          <motion.div key="intro" className="fixed inset-0 z-[60]" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <IntroSmoke ready={ready} onDone={endIntro} />
            <button onClick={endIntro} className="fixed right-5 top-5 z-[61] border border-pearl/30 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-pearl/80 transition-colors hover:border-pearl hover:text-pearl sm:right-8 sm:top-8">
              Skip intro
            </button>
            {!ready && <p className="fixed inset-x-0 bottom-10 z-[61] text-center text-[0.65rem] uppercase tracking-[0.25em] text-pearl/40">Preparing the house…</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <ProductPanel kind={panel} onClose={() => setPanel(null)} />
    </div>
  );
}
