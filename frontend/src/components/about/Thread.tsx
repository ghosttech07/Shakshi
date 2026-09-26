"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IMG } from "@shakshi/shared/images";
import { Logo } from "@/components/brand/Logo";

const EASE = [0.65, 0, 0.35, 1] as const;

const CHAPTERS = [
  { year: "2012", title: "The Beginning", lines: ["It began with one bed, stitched by hand", "for our own family, in a small room in Bengaluru.", "It took eleven days. We have never hurried since."], image: IMG.sleepMono, alt: "Someone asleep in soft white linen" },
  { year: "2014", title: "The First Workshop", lines: ["A rented workshop among coconut groves,", "four craftspeople, and a long wooden table", "where every mattress was tufted, tied and signed."], image: IMG.artisan, alt: "An artisan's hands at a workbench" },
  { year: "2016", title: "The Material Search", lines: ["We went looking for the softest things on earth:", "wool from the hills, latex from Kerala's rubber trees,", "cotton grown without a single shortcut."], image: IMG.sheep, alt: "A flock of woolly sheep in a meadow" },
  { year: "2019", title: "The First Bed", lines: ["The first Shakshi collection left the workshop.", "Families wrote to tell us they slept through the night.", "We kept every letter."], image: IMG.tufted, alt: "A tufted headboard above crisp bedding" },
  { year: "2024", title: "Today", lines: ["Forty hands, twelve hours for every mattress,", "and homes across India that rest a little deeper.", "The table is longer now. The care is the same."], image: IMG.grandSuite, alt: "A calm suite in evening light" },
  { year: "2030", title: "What's Next", lines: ["Beds that give back more than they take:", "fully recyclable, repaired rather than replaced,", "and made to be handed down."], image: IMG.forest, alt: "Light falling through a quiet forest" },
];

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
    <p className="mt-8 max-w-xl font-serif text-xl font-light leading-snug text-pearl/85 sm:text-2xl lg:text-[1.6rem]">
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

export function Thread() {
  const reduce = !!useReducedMotion();
  const [fine, setFine] = useState(false);
  useEffect(() => setFine(matchMedia("(pointer: fine)").matches), []);
  const lampOn = fine && !reduce;
  const { glow, register } = useLamp(lampOn);

  const wrap = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const knot = useRef<SVGGElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const anchors = useRef<(HTMLElement | null)[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const [d, setD] = useState("");
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Build the thread from where the years actually sit, weaving side to side between them.
  useEffect(() => {
    const build = () => {
      const box = wrap.current?.getBoundingClientRect();
      if (!box) return;
      const pts = [{ x: box.width / 2, y: 0 }];
      for (const a of anchors.current) {
        if (!a) continue;
        const r = a.getBoundingClientRect();
        pts.push({ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 });
      }
      const e = end.current?.getBoundingClientRect();
      const ex = box.width / 2;
      const ey = e ? e.top - box.top : box.height - 200;
      pts.push({ x: ex, y: ey });
      let p = `M${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const dy = b.y - a.y;
        // a stitch-like S: leave straight down, arrive straight down
        p += ` C${a.x},${a.y + dy * 0.55} ${b.x},${b.y - dy * 0.55} ${b.x},${b.y}`;
      }
      // One small loop at the end: the knot
      p += ` c 0,26 -30,34 -30,58 c 0,24 30,24 30,0 c 0,-24 -30,-16 -30,8`;
      setD(p);
      setSize({ w: box.width, h: box.height });
    };
    build();
    const ro = new ResizeObserver(build);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);

  // Draw it with the scroll, trailing slightly (scrub), and fill each year as the thread reaches it.
  useEffect(() => {
    if (!d || !path.current || !wrap.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const len = path.current.getTotalLength();
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(path.current, { strokeDasharray: "none", strokeDashoffset: 0 });
        gsap.set(".year-fill", { clipPath: "inset(0% 0 0 0)" });
        return;
      }
      gsap.set(path.current, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(path.current, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: { trigger: wrap.current, start: "top 45%", end: "bottom 75%", scrub: 1.2 },
      });
      gsap.utils.toArray<HTMLElement>(".year-fill").forEach((el) => {
        gsap.fromTo(el, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", ease: "power3.inOut", scrollTrigger: { trigger: el, start: "top 62%", end: "bottom 42%", scrub: 1.2 } });
      });
      // Touch screens: each photograph slowly brightens as it reaches the centre
      if (!lampOn) {
        gsap.utils.toArray<HTMLElement>(".lamp-color").forEach((el) => {
          gsap.fromTo(el, { opacity: 0 }, { opacity: 1, ease: "power3.inOut", scrollTrigger: { trigger: el, start: "top 80%", end: "center 50%", scrub: 1.2 } });
        });
      }
      // The knot becomes the logo
      gsap.timeline({ scrollTrigger: { trigger: end.current, start: "top 75%", end: "top 35%", scrub: 1.4 } })
        .fromTo(knot.current, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%", ease: "power3.inOut" })
        .fromTo(logo.current, { opacity: 0, scale: 0.85, filter: "blur(6px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", ease: "power3.inOut" }, "<0.2");
    }, wrap);
    return () => ctx.revert();
  }, [d, reduce, lampOn]);

  const knotAt = d ? d.match(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+c 0,26/)?.slice(1).map(Number) : null;

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
          Every great night begins with a <em className="text-gold-soft">single stitch.</em>
        </motion.h1>
        <span aria-hidden className="absolute left-1/2 top-0 h-[30vh] w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-gold" />
        <motion.p className="eyebrow absolute bottom-10 text-pearl/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1.4 }} aria-hidden>
          Follow the thread
        </motion.p>
      </section>

      {/* The story */}
      <div ref={wrap} className="relative">
        {d && (
          <svg aria-hidden className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none">
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
                <circle cx={knotAt[0] - 15} cy={knotAt[1] + 70} r="5" fill="#c9a96e" />
              </g>
            )}
          </svg>
        )}

        {CHAPTERS.map((c, i) => {
          const right = i % 2 === 1;
          return (
            <section key={c.year} className="container-lux relative z-10 grid min-h-[120svh] items-center gap-12 py-24 lg:grid-cols-2 lg:gap-24" aria-labelledby={`ch-${c.year}`}>
              <div className={right ? "lg:order-2" : ""}>
                <div
                  ref={(el) => {
                    anchors.current[i] = el;
                    if (el && lampOn) register("year")(el);
                  }}
                  className="year relative inline-block font-serif text-[6.5rem] font-light leading-none sm:text-[9rem] lg:text-[11rem]"
                  aria-hidden
                >
                  <span className="text-transparent [-webkit-text-stroke:1px_rgb(201_169_110/0.7)]">{c.year}</span>
                  <span className="year-fill absolute inset-0 text-gold" style={{ clipPath: reduce ? "none" : "inset(100% 0 0 0)" }}>
                    {c.year}
                  </span>
                </div>
                <p className="eyebrow mt-8 text-gold">{c.year === "2030" ? "Next" : c.year}</p>
                <h2 id={`ch-${c.year}`} className="mt-3 text-4xl sm:text-5xl">
                  {c.title}
                </h2>
                <Lines lines={c.lines} reduce={reduce} />
              </div>
              <div className={right ? "lg:order-1" : ""} style={{ perspective: 1200 }}>
                <figure ref={lampOn ? register("image") : undefined} className="lamp-photo relative aspect-[4/5] w-full max-w-md overflow-hidden lg:mx-auto">
                  {/* In darkness… */}
                  <Image src={c.image} alt={c.alt} fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover [filter:brightness(0.14)_saturate(0.4)]" data-keep-bright />
                  {/* …until the lamp finds it */}
                  <div className="lamp-color absolute inset-0" aria-hidden style={{ opacity: lampOn || reduce ? 1 : 0 }}>
                    <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 30vw, 90vw" className="object-cover [filter:sepia(0.18)_saturate(1.1)_brightness(1.05)]" data-keep-bright />
                  </div>
                </figure>
              </div>
            </section>
          );
        })}

        {/* The knot, the logo, the invitation */}
        <section ref={end} className="relative z-10 flex min-h-[110svh] flex-col items-center justify-center px-6 pt-40 text-center" aria-labelledby="thread-end">
          <div ref={logo} style={{ opacity: reduce ? 1 : 0 }}>
            <Logo variant="lockup" tone="light" className="h-20 [background-color:var(--color-gold)]! sm:h-28" />
          </div>
          <h2 id="thread-end" className="display mt-14 text-4xl font-light sm:text-6xl">
            The thread continues <em className="text-gold-soft">with you.</em>
          </h2>
          <Link href="/quiz" className="btn btn-gold mt-12">
            Find Your Mattress
          </Link>
        </section>
      </div>
    </div>
  );
}
