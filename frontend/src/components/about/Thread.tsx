"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SECTIONS } from "@shakshi/shared/cms/sections";
import { Emph, lines as splitLines, fieldFn } from "@/components/cms/text";
import { Logo } from "@/components/brand/Logo";

const EASE = [0.65, 0, 0.35, 1] as const;

type Chapter = { year: string; label?: string; title: string; lines: string; image: string; alt: string };
type ThreadData = { intro?: string; hint?: string; chapters?: Chapter[]; closing?: string; ctaText?: string; ctaLink?: string };
const DEFAULTS = SECTIONS["thread-journey"].defaults as ThreadData;

// ---------- the lamp: one eased pointer shared by every glowing thing on the page ----------
type LampTarget = { el: HTMLElement; kind: "image" | "year" };

function useLamp(enabled: boolean) {
  const targets = useRef<LampTarget[]>([]);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("lamp-mode");
    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const pos = { ...target };
    let raf = 0;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible && glow.current) {
        visible = true;
        glow.current.style.opacity = "1";
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      // lerp ~0.1: the light trails the hand, like a lamp being carried
      pos.x += (target.x - pos.x) * 0.1;
      pos.y += (target.y - pos.y) * 0.1;
      if (glow.current) glow.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      for (const t of targets.current) {
        const r = t.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) continue;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const nx = Math.max(-1, Math.min(1, (pos.x - cx) / (innerWidth / 2)));
        const ny = Math.max(-1, Math.min(1, (pos.y - cy) / (innerHeight / 2)));
        t.el.style.setProperty("--lx", `${pos.x - r.left}px`);
        t.el.style.setProperty("--ly", `${pos.y - r.top}px`);
        t.el.style.setProperty("--rx", `${(-ny * 5).toFixed(2)}deg`);
        t.el.style.setProperty("--ry", `${(nx * 5).toFixed(2)}deg`);
        if (t.kind === "year") {
          // Gently magnetic: drift a few pixels toward the light when it's near
          const d = Math.hypot(pos.x - cx, pos.y - cy);
          const pull = d < 320 ? (1 - d / 320) * 10 : 0;
          t.el.style.setProperty("--mx", `${((pos.x - cx) / (d || 1)) * pull}px`);
          t.el.style.setProperty("--my", `${((pos.y - cy) / (d || 1)) * pull}px`);
        } else {
          t.el.style.setProperty("--px", `${nx * 8}px`);
          t.el.style.setProperty("--py", `${ny * 8}px`);
        }
      }
      const settled = Math.abs(target.x - pos.x) < 0.2 && Math.abs(target.y - pos.y) < 0.2;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };

    addEventListener("pointermove", onMove, { passive: true });
    return () => {
      root.classList.remove("lamp-mode");
      removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  const register = (kind: LampTarget["kind"]) => (el: HTMLElement | null) => {
    if (el && !targets.current.some((t) => t.el === el)) targets.current.push({ el, kind });
  };
  return { glow, register };
}

function Lines({ lines, reduce }: { lines: string[]; reduce: boolean }) {
  return (
    <p className="mt-4 max-w-xl font-serif text-lg font-light leading-snug text-pearl/85 sm:text-xl lg:mt-6 lg:text-[1.45rem]">
      {lines.map((l, i) => (
        <span key={l} className="block overflow-hidden pb-1">
          <motion.span
            className="block"
            initial={reduce ? { opacity: 0 } : { y: "105%" }}
            whileInView={reduce ? { opacity: 1 } : { y: "0%" }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 1.2, delay: 0.25 + i * 0.16, ease: EASE }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </p>
  );
}

export function Thread({ data = {}, edit }: { data?: ThreadData; edit?: boolean }) {
  const f = fieldFn(edit);
  const t = { ...DEFAULTS, ...data };
  const CHAPTERS = (t.chapters ?? []).map((c) => ({ ...c, lines: splitLines(c.lines) }));
  const reduce = !!useReducedMotion();
  const [fine, setFine] = useState(false);
  useEffect(() => setFine(matchMedia("(pointer: fine)").matches), []);
  const lampOn = fine && !reduce;
  const { glow, register } = useLamp(lampOn);

  const stage = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const knot = useRef<SVGGElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const anchors = useRef<(HTMLElement | null)[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const [d, setD] = useState("");
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Build the thread across the track: in from the left, through each year, weaving up and down, out to the right.
  useEffect(() => {
    const build = () => {
      const box = track.current?.getBoundingClientRect();
      if (!box) return;
      const mid = box.height / 2;
      const pts = [{ x: 0, y: mid }];
      for (const a of anchors.current) {
        if (!a || !a.isConnected) continue;
        const r = a.getBoundingClientRect();
        pts.push({ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 });
      }
      pts.push({ x: box.width - 90, y: mid });
      let p = `M${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const dx = b.x - a.x;
        // a stitch-like S: leave level, arrive level
        p += ` C${a.x + dx * 0.55},${a.y} ${b.x - dx * 0.55},${b.y} ${b.x},${b.y}`;
      }
      // One small loop at the end: the knot
      p += ` c 26,0 34,-30 58,-30 c 24,0 24,30 0,30 c -24,0 -16,-30 8,-30`;
      setD(p);
      setSize({ w: box.width, h: box.height });
    };
    build();
    const ro = new ResizeObserver(build);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, [CHAPTERS.length]);

  // Scrolling down moves the story sideways; the thread draws and each year fills as it passes the middle.
  // Layout effect, so the pin is undone before React removes the page on navigation.
  useLayoutEffect(() => {
    if (!d || !path.current || !track.current || !stage.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const len = path.current.getTotalLength();
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(path.current, { strokeDasharray: "none", strokeDashoffset: 0 });
        gsap.set(".year-fill", { clipPath: "inset(0 0% 0 0)" });
        return;
      }
      const distance = () => Math.max(0, track.current!.scrollWidth - innerWidth);
      const lead = () => innerWidth / 2 / Math.max(1, track.current!.scrollWidth); // the part of the thread already in view at the start
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: stage.current, pin: true, start: "top top", end: () => `+=${distance()}`, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      tl.fromTo(track.current, { x: 0 }, { x: () => -distance() }, 0);
      tl.fromTo(path.current, { strokeDasharray: len, strokeDashoffset: () => len * (1 - lead()) }, { strokeDashoffset: 0 }, 0);
      const move = tl.getChildren()[0] as gsap.core.Tween;
      gsap.utils.toArray<HTMLElement>(".year-fill").forEach((el) => {
        gsap.fromTo(el, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", ease: "power3.inOut", scrollTrigger: { trigger: el, containerAnimation: move, start: "left 70%", end: "right 45%", scrub: 1 } });
      });
      // Touch screens: each photograph slowly brightens as it reaches the centre
      if (!lampOn) {
        gsap.utils.toArray<HTMLElement>(".lamp-color").forEach((el) => {
          gsap.fromTo(el, { opacity: 0 }, { opacity: 1, ease: "power3.inOut", scrollTrigger: { trigger: el, containerAnimation: move, start: "left 85%", end: "center 55%", scrub: 1 } });
        });
      }
      // The knot becomes the logo
      gsap.timeline({ scrollTrigger: { trigger: end.current, start: "top 80%", end: "top 40%", scrub: 1.4 } })
        .fromTo(knot.current, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", ease: "power3.inOut" })
        .fromTo(logo.current, { opacity: 0, scale: 0.85, filter: "blur(6px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", ease: "power3.inOut" }, "<0.2");
    });
    return () => ctx.revert();
  }, [d, reduce, lampOn, CHAPTERS.length]);

  const knotAt = d ? d.match(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+c 26,0/)?.slice(1).map(Number) : null;

  return (
    <div className="relative bg-midnight text-pearl" data-dark-hero>
      {/* The lamp */}
      {lampOn && <div ref={glow} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[70] h-[500px] w-[500px] rounded-full opacity-0 mix-blend-screen transition-opacity duration-1000" style={{ background: "radial-gradient(circle, rgb(255 190 110 / 0.16) 0%, rgb(255 170 90 / 0.06) 30%, transparent 60%)" }} />}

      {/* Intro */}
      <section className="relative grid min-h-[100svh] place-items-center px-6 text-center" aria-labelledby="thread-title">
        <motion.h1
          id="thread-title"
          className="display max-w-3xl text-4xl font-light sm:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, delay: 0.4, ease: EASE }}
        >
          <span {...f("intro")}>
            <Emph text={t.intro ?? ""} emClassName="text-gold-soft" />
          </span>
        </motion.h1>
        <span aria-hidden className="absolute bottom-24 left-0 h-px w-[45vw] bg-gradient-to-r from-transparent to-gold" />
        <motion.p className="eyebrow absolute bottom-10 text-pearl/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1.4 }} aria-hidden>
          {t.hint}
        </motion.p>
      </section>

      {/* The story, travelling sideways. The outer div belongs to React; GSAP's pin spacer goes inside it. */}
      <div>
        <section ref={stage} className={reduce ? "relative" : "relative h-[100svh] overflow-hidden"} aria-label="Our story">
          <div ref={track} className={reduce ? "relative flex snap-x snap-mandatory overflow-x-auto" : "relative flex h-full w-max"}>
            {d && (
              <svg aria-hidden className="pointer-events-none absolute left-0 top-0 z-0 overflow-visible" width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
                <defs>
                  <filter id="thread-glow" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="2.5" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path ref={path} d={d} fill="none" stroke="#c9a96e" strokeWidth="1.4" strokeLinecap="round" filter="url(#thread-glow)" />
                {knotAt && (
                  <g ref={knot}>
                    <circle cx={knotAt[0] + 70} cy={knotAt[1] - 15} r="5" fill="#c9a96e" />
                  </g>
                )}
              </svg>
            )}

            {CHAPTERS.map((c, i) => {
              const high = i % 2 === 0;
              return (
                <article
                  key={i}
                  className="relative z-10 flex h-[100svh] w-screen shrink-0 snap-center items-center px-6 sm:px-12 lg:px-[8vw]"
                  aria-labelledby={`ch-${i}`}
                  {...f(`chapters.${i}.title`)}
                >
                  <div className={`grid w-full items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 ${high ? "lg:-translate-y-[7vh]" : "lg:translate-y-[7vh]"}`}>
                    <div className={high ? "" : "lg:order-2"}>
                      <div
                        ref={(el) => {
                          anchors.current[i] = el;
                          if (el && lampOn) register("year")(el);
                        }}
                        className="year relative inline-block font-serif text-[4.5rem] font-light leading-none sm:text-[7rem] lg:text-[10rem]"
                        aria-hidden
                      >
                        <span className="text-transparent [-webkit-text-stroke:1px_rgb(201_169_110/0.7)]">{c.year}</span>
                        <span className="year-fill absolute inset-0 text-gold" style={{ clipPath: reduce ? "none" : "inset(0 100% 0 0)" }}>
                          {c.year}
                        </span>
                      </div>
                      <p className="eyebrow mt-4 text-gold lg:mt-8">{c.label || c.year}</p>
                      <h2 id={`ch-${i}`} className="mt-2 text-3xl sm:text-4xl lg:mt-3 lg:text-5xl">
                        {c.title}
                      </h2>
                      <Lines lines={c.lines} reduce={reduce} />
                    </div>
                    <div className={high ? "" : "lg:order-1"} style={{ perspective: 1200 }}>
                      <figure ref={lampOn ? register("image") : undefined} className="lamp-photo relative mx-auto aspect-[4/3] max-h-[30svh] w-full max-w-md overflow-hidden lg:aspect-[4/5] lg:max-h-[62svh]">
                        {/* In darkness… */}
                        <Image src={c.image} alt={c.alt ?? ""} fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover [filter:brightness(0.14)_saturate(0.4)]" data-keep-bright />
                        {/* …until the lamp finds it */}
                        <div className="lamp-color absolute inset-0" aria-hidden style={{ opacity: lampOn || reduce ? 1 : 0 }}>
                          <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover [filter:sepia(0.18)_saturate(1.1)_brightness(1.05)]" data-keep-bright />
                        </div>
                      </figure>
                    </div>
                  </div>
                </article>
              );
            })}
            {/* Room for the thread to tie its knot before the story ends */}
            <div aria-hidden className="h-[100svh] w-[30vw] shrink-0" />
          </div>
        </section>
      </div>

      {/* The logo, the invitation */}
      <section ref={end} className="relative z-10 flex min-h-[90svh] flex-col items-center justify-center px-6 py-32 text-center" aria-labelledby="thread-end">
        <div ref={logo} style={{ opacity: reduce ? 1 : 0 }}>
          <Logo variant="lockup" tone="light" className="h-20 [background-color:var(--color-gold)]! sm:h-28" />
        </div>
        <h2 id="thread-end" className="display mt-14 text-4xl font-light sm:text-6xl">
          <span {...f("closing")}>
            <Emph text={t.closing ?? ""} emClassName="text-gold-soft" />
          </span>
        </h2>
        {t.ctaText && (
          <Link href={t.ctaLink || "/shop"} className="btn btn-gold mt-12" {...f("ctaText")}>
            {t.ctaText}
          </Link>
        )}
      </section>
    </div>
  );
}
