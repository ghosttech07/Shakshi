"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { getProduct } from "@/lib/products";
import { cn } from "@/lib/utils";
import { layerKind } from "@/components/three/MattressModel";

const W = 360;
const D = 250;

const SURFACES: Record<string, { top: string; side: string }> = {
  cover: {
    top: "repeating-linear-gradient(45deg,transparent 0 21px,rgb(0 0 0/.07) 21px 22px),repeating-linear-gradient(-45deg,transparent 0 21px,rgb(0 0 0/.07) 21px 22px),radial-gradient(120% 120% at 30% 20%,#fbf7f0,#e9e0d1)",
    side: "repeating-linear-gradient(90deg,#e4dac9 0 3px,#dcd1be 3px 5px)",
  },
  gel: {
    top: "radial-gradient(circle at 30% 30%,rgb(255 255 255/.35) 0 1px,transparent 2px) 0 0/9px 9px,linear-gradient(135deg,#b5d3db,#7fa6b3)",
    side: "linear-gradient(180deg,#8fb3bf,#6d94a2)",
  },
  foam: {
    top: "radial-gradient(circle,rgb(0 0 0/.09) 0 1.2px,transparent 1.8px) 0 0/7px 7px,linear-gradient(135deg,#f6eddc,#e6d8bf)",
    side: "radial-gradient(circle,rgb(0 0 0/.1) 0 1px,transparent 1.6px) 0 0/6px 6px,#dfd0b5",
  },
  latex: {
    top: "radial-gradient(circle,rgb(120 90 40/.25) 0 3px,transparent 3.6px) 0 0/16px 16px,linear-gradient(135deg,#f2e3bb,#e1cc98)",
    side: "#d9c38e",
  },
  wool: {
    top: "repeating-linear-gradient(0deg,rgb(0 0 0/.04) 0 1px,transparent 1px 3px),linear-gradient(135deg,#f3ebdf,#e2d5c1)",
    side: "#d8cab4",
  },
  springs: {
    top: "radial-gradient(circle,transparent 0 5px,#c9c1b4 5.5px 7.5px,transparent 8px) 0 0/22px 22px,linear-gradient(135deg,#2c3446,#1c2230)",
    side: "repeating-linear-gradient(90deg,#1c2230 0 8px,#9c9486 8px 10px)",
  },
  base: {
    top: "repeating-linear-gradient(90deg,rgb(0 0 0/.06) 0 1px,transparent 1px 4px),linear-gradient(135deg,#a89f94,#8b8277)",
    side: "#7b7268",
  },
};

export function Anatomy() {
  const product = getProduct("signature")!;
  const layers = product.layers;
  const n = layers.length;
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(-1);

  // Thickness in px, and resting height of each slab from the bottom up
  const thick = layers.map((l) => 12 + l.depth * 2.3);
  const restZ = layers.map((_, i) => thick.slice(i + 1).reduce((a, b) => a + b, 0));

  useEffect(() => {
    if (reduce || !section.current || !stage.current) {
      stage.current?.style.setProperty("--e", "1");
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        stage.current,
        { "--e": 0, "--turn": 0 },
        {
          "--e": 1,
          "--turn": 1,
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

        <div className="relative flex h-[46svh] items-center justify-center sm:h-[520px] lg:h-[640px]" style={{ perspective: "1800px" }} aria-hidden>
          <div
            ref={stage}
            className="relative scale-[0.62] sm:scale-90 lg:scale-100"
            style={
              {
                "--e": 0,
                "--turn": 0,
                width: W,
                height: D,
                transformStyle: "preserve-3d",
                transform: "translateY(calc(var(--e) * 120px)) rotateX(58deg) rotateZ(calc(-34deg - var(--turn) * 10deg))",
              } as CSSProperties
            }
          >
            {layers.map((l, i) => {
              const surf = SURFACES[layerKind(l, i)];
              const t = thick[i];
              const lift = (n - 1 - i) * 62;
              const dim = active >= 0 && active !== i && !reduce;
              return (
                <div
                  key={l.name}
                  className="absolute inset-0"
                  style={{ transformStyle: "preserve-3d", transform: `translateZ(calc(${restZ[i]}px + var(--e) * ${lift}px))` }}
                >
                  {[
                    { style: { inset: 0, transform: `translateZ(${t}px)`, background: surf.top } },
                    { style: { left: 0, top: D, width: W, height: t, transformOrigin: "top", transform: "rotateX(90deg)", background: surf.side } },
                    { style: { left: W, top: 0, width: t, height: D, transformOrigin: "left", transform: "rotateY(-90deg)", background: surf.side } },
                  ].map((f, k) => (
                    <div
                      key={k}
                      className="absolute transition-[filter,box-shadow] duration-1000 ease-silk"
                      style={{
                        ...f.style,
                        filter: dim ? "brightness(.45) saturate(.5)" : ["none", "brightness(.9)", "brightness(.75)"][k],
                        boxShadow: k === 0 && active === i ? "0 0 0 1.5px #c9a96e, 0 0 60px rgb(201 169 110 / .45)" : undefined,
                        borderRadius: k === 0 ? 6 : 2,
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>

          {/* Soft floor shadow */}
          <div className="absolute bottom-[8%] left-1/2 h-16 w-[70%] -translate-x-1/2 rounded-[50%] bg-black/40 blur-2xl" />
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
  );
}
