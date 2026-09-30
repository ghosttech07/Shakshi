"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { lockScroll, scrollToTarget, unlockScroll } from "@/components/layout/SmoothScroll";
import { useCatalog } from "@/lib/catalog-context";
import { EASE, cn } from "@shakshi/shared/utils";
import { IntroSmoke } from "./IntroSmoke";
import { ProductPanel, type PanelKind } from "./ProductPanel";
import type { HotspotId } from "./Hotspot";
import { BEDROOMS, roomAt, roomProgress, type ThemeId } from "./layout";
import { THEMES } from "./themes";

const HouseScene = dynamic(() => import("./HouseScene"), { ssr: false });

const SEEN = "shk-house-intro";

/** What the page shows around the scene. It changes only a few times on the whole walk, so scrolling doesn't re-render React. */
type Stage = { room: ThemeId | null; start: boolean; welcome: boolean };
const stageAt = (p: number): Stage => ({ room: roomAt(p), start: p < 0.02, welcome: p < 0.1 });
const same = (a: Stage, b: Stage) => a.room === b.room && a.start === b.start && a.welcome === b.welcome;

/**
 * The house. A logo that dissolves into smoke, then a scroll-driven walk: in through the front
 * doors, straight down the corridor and into four bedrooms, each with its own theme. In each
 * bedroom the mattress, the pillows and the bedding open the collection.
 */
export function HouseExperience() {
  const router = useRouter();
  const { products } = useCatalog();
  const progress = useRef(0);
  const [stage, setStage] = useState<Stage>(() => stageAt(0));
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

  // Scroll position → progress through the house (the scene reads it every frame; React only hears about changes of room)
  useEffect(() => {
    let raf = 0;
    const read = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.current = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      const next = stageAt(progress.current);
      setStage((cur) => (same(cur, next) ? cur : next));
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

  const goTo = useCallback((id: ThemeId) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollToTarget(Math.round(roomProgress(id) * max));
  }, []);

  const select = useCallback(
    (id: HotspotId) => {
      if (id === "library") return router.push("/sleep-library");
      if (id === "story") return router.push("/about");
      setPanel(id);
    },
    [router]
  );
  const onReady = useCallback(() => setReady(true), []);
  const closePanel = useCallback(() => setPanel(null), []);

  const room = stage.room;
  const theme = room ? THEMES[room] : null;
  const onBed = theme ? products.find((p) => p.slug === theme.product) : undefined;
  const number = room ? BEDROOMS.findIndex((b) => b.id === room) + 1 : 0;

  return (
    <div className="relative">
      {/* The house fills the whole screen; the page scrolls beneath it */}
      <div className="fixed inset-0 z-0 bg-[#0b0d12]">
        <HouseScene progress={progress} room={panel ? null : room} onSelect={select} onReady={onReady} lite={lite} />
      </div>
      <div aria-hidden style={{ height: "1000svh" }} />

      {/* Arriving */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[22svh] z-10 flex justify-center px-5">
        <AnimatePresence>
          {!intro && stage.welcome && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.9, ease: EASE }} className="text-center text-pearl [text-shadow:0_2px_24px_rgb(0_0_0/0.55)]">
              <p className="eyebrow text-gold-soft">Shakshi</p>
              <p className="display mt-3 text-4xl sm:text-6xl">Welcome home.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* In a bedroom: its name, its mood and the mattress on its bed */}
      <div className="pointer-events-none fixed left-0 top-24 z-10 max-w-[min(26rem,calc(100vw-4.5rem))] px-5 sm:bottom-24 sm:top-auto sm:px-10 lg:px-14">
        <AnimatePresence mode="wait">
          {theme && !panel && (
            <motion.div key={theme.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.8, ease: EASE }} className="text-pearl [text-shadow:0_2px_20px_rgb(0_0_0/0.6)]">
              <p className="eyebrow text-gold-soft">
                Bedroom {number} of {BEDROOMS.length}
              </p>
              <p className="display mt-2 text-3xl sm:text-5xl">{theme.name}</p>
              <p className="mt-3 text-sm leading-relaxed text-pearl/85 sm:text-base">{theme.line}</p>
              {onBed && (
                <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-pearl/70">
                  On the bed: <span className="text-gold-soft">{onBed.name}</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Jump between the bedrooms */}
      <AnimatePresence>
        {!intro && !panel && (
          <motion.nav key="rooms" aria-label="Bedrooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className={cn("fixed bottom-16 left-1/2 z-20 flex -translate-x-1/2 flex-row sm:bottom-auto sm:left-auto sm:right-8 sm:top-1/2 sm:translate-x-0 sm:-translate-y-1/2 sm:flex-col", stage.welcome && "max-sm:hidden")}>
            {BEDROOMS.map((b) => {
              const on = room === b.id;
              return (
                <button key={b.id} onClick={() => goTo(b.id)} aria-label={THEMES[b.id].name} aria-current={on ? "true" : undefined} className="group flex items-center justify-end gap-3 p-2.5 text-pearl sm:py-2 sm:pl-3 sm:pr-1">
                  <span className={cn("hidden text-[0.65rem] font-semibold uppercase tracking-[0.18em] transition-opacity [text-shadow:0_1px_10px_rgb(0_0_0/0.7)] md:inline", on ? "opacity-100" : "opacity-0 group-hover:opacity-80")}>{THEMES[b.id].name}</span>
                  <span className={cn("block rounded-full border border-pearl/70 transition-all duration-500", on ? "h-3 w-3 bg-gold" : "h-2 w-2 group-hover:bg-pearl/60")} />
                </button>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* First screen: invite the scroll */}
      <AnimatePresence>
        {!intro && stage.start && (
          <motion.div key="cue" className="pointer-events-none fixed inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3 text-pearl/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            <span className="eyebrow text-[0.65rem]">Scroll to step inside</span>
            <span className="relative h-12 w-px overflow-hidden bg-pearl/25">
              <motion.span className="absolute inset-x-0 top-0 h-1/2 bg-gold" animate={{ y: ["-100%", "200%"] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In a bedroom: how to explore */}
      <AnimatePresence>
        {room && !panel && (
          <motion.p key="hint" className="pointer-events-none fixed inset-x-0 bottom-6 z-10 mx-auto max-w-2xl pl-5 pr-24 text-left text-xs sm:px-5 sm:text-center text-pearl/85 [text-shadow:0_1px_12px_rgb(0_0_0/0.6)] sm:text-sm" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, delay: 0.6 }}>
            Tap the mattress, the pillows or the bedding to see the collection. Keep scrolling for the next bedroom.
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

      <ProductPanel kind={panel} onClose={closePanel} featured={theme?.product} />
    </div>
  );
}
