"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/motion";
import { getProduct } from "@shakshi/shared/products";
import { cn } from "@shakshi/shared/utils";
import { layerKind } from "@/components/three/MattressModel";
import type { LayersProgress } from "@/components/three/LayersScene";

const LayersScene = dynamic(() => import("@/components/three/LayersScene"), { ssr: false });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Anatomy(_props: { data?: Record<string, unknown>; edit?: boolean } = {}) {
  const product = getProduct("signature")!;
  const layers = product.layers;
  const n = layers.length;
  const section = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(-1);
  const [inView, setInView] = useState(false);
  const progress = useRef<LayersProgress>({ e: 0, turn: 0 });
  const kinds = useMemo(() => layers.map((l, i) => layerKind(l, i)), [layers]);
  const depths = useMemo(() => layers.map((l) => l.depth), [layers]);

  // The 3D scene only draws while the section is on screen.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Layout effect: the pin is undone (ctx.revert) before React removes the section on navigation.
  useLayoutEffect(() => {
    if (reduce || !section.current) {
      progress.current = { e: 1, turn: 0.5 };
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        progress.current,
        { e: 0, turn: 0 },
        {
          e: 1,
          turn: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "+=260%",
            scrub: 1.4,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              const p = self.progress;
              setActive(p < 0.12 ? -1 : Math.min(n - 1, Math.floor(((p - 0.12) / 0.84) * n)));
            },
          },
        }
      );
    }, section);
    return () => ctx.revert();
  }, [reduce, n]);

  return (
    // The wrapper belongs to React; GSAP's pin spacer is added inside it, never around it.
    <div>
    <section ref={section} className="relative overflow-hidden bg-midnight text-pearl linen-dark" aria-labelledby="anatomy-title">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_50%,rgb(201_169_110/0.12),transparent_70%)]" />
      <div className={cn("container-lux relative grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]", reduce ? "py-24" : "h-[100svh] py-20")}>
        <div className="relative z-10">
          <p className="eyebrow text-gold">Anatomy of comfort</p>
          <h2 id="anatomy-title" className="display mt-4 text-4xl sm:text-5xl lg:text-6xl">
            Five layers.
            <br />
            <em className="text-gold-soft">One weightless feeling.</em>
          </h2>
          <p className="mt-5 hidden max-w-md text-pearl/65 sm:block">
            Inside {product.name}, each layer has one quiet task. Together they hold you, cool you, and let you go.
          </p>

          <ol className={cn("mt-8 space-y-1", reduce ? "block" : "hidden lg:block")}>
            {layers.map((l, i) => (
              <li
                key={l.name}
                className={cn(
                  "grid grid-cols-[2.5rem_1fr] border-t border-pearl/10 py-3.5 transition-all duration-1000 ease-silk",
                  active === i || reduce ? "opacity-100" : "opacity-40"
                )}
              >
                <span className="font-serif text-lg text-gold">0{i + 1}</span>
                <div>
                  <p className="font-serif text-2xl leading-tight">{l.name}</p>
                  <div className={cn("grid transition-[grid-template-rows] duration-1000 ease-silk", active === i || reduce ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <p className="overflow-hidden text-sm text-pearl/65">
                      {l.material} <span className="text-gold">·</span> {l.benefit}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative h-[46svh] sm:h-[min(520px,calc(100svh-10rem))] lg:h-[min(680px,calc(100svh-10rem))]" aria-hidden>
          <LayersScene kinds={kinds} depths={depths} progress={progress} active={reduce ? -1 : active} live={inView} still={reduce} />
        </div>

        {!reduce && (
          <div className="relative z-10 min-h-[92px] lg:hidden" aria-live="polite">
            {layers.map((l, i) => (
              <div key={l.name} className={cn("absolute inset-x-0 top-0 transition-all duration-1000 ease-silk", active === i ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")} aria-hidden={active !== i}>
                <p className="font-serif text-lg text-gold">0{i + 1} · {l.name}</p>
                <p className="mt-1 text-sm text-pearl/70">
                  {l.material}. {l.benefit}.
                </p>
              </div>
            ))}
            <p className={cn("absolute inset-x-0 top-0 text-sm text-pearl/55 transition-opacity duration-700", active === -1 ? "opacity-100" : "opacity-0")}>Keep scrolling to look inside.</p>
          </div>
        )}
      </div>
    </section>
    </div>
  );
}
