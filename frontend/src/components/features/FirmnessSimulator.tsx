"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useCatalog } from "@/lib/catalog-context";
import { layerKind } from "@/components/three/MattressModel";
import { cn } from "@shakshi/shared/utils";
import { FirmnessScale } from "@/components/ui/Bits";

const VW = 800;
const X0 = 50;
const X1 = 750;
const TOP = 130;
const BOTTOM = 310;
const STEP = 8;
const PX_PER_CM = 7.5;

const FILL: Record<string, string> = {
  cover: "url(#sim-quilt)",
  gel: "#a9c9d3",
  foam: "#efe3cc",
  latex: "#ead9aa",
  wool: "#e6d9c5",
  springs: "url(#sim-coils)",
  base: "#a89f94",
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function FirmnessSimulator({ dark = false, initial = "signature" }: { dark?: boolean; initial?: string }) {
  const uid = useId().replace(/:/g, "");
  const [slug, setSlug] = useState(initial);
  const { products: PRODUCTS } = useCatalog();
  const product = PRODUCTS.find((p) => p.slug === slug) ?? PRODUCTS[0];
  const [readout, setReadout] = useState(0);
  const [hint, setHint] = useState(true);

  const svg = useRef<SVGSVGElement>(null);
  const bands = useRef<(SVGPathElement | null)[]>([]);
  const palm = useRef<SVGGElement>(null);
  const glow = useRef<SVGEllipseElement>(null);
  const state = useRef({ x: 400, pressure: 0, target: 0, raf: 0, last: 0 });

  const layers = product.layers;
  // Boundaries between bands, top down, and how much of the dip each boundary carries.
  const { bounds, carry } = useMemo(() => {
    const total = layers.reduce((a, l) => a + l.depth, 0);
    const bounds = layers.reduce<number[]>((acc, l) => [...acc, acc[acc.length - 1] + (l.depth / total) * (BOTTOM - TOP)], [TOP]);
    const carry = bounds.map((y) => Math.pow(1 - (y - TOP) / (BOTTOM - TOP), 1.8));
    return { bounds, carry };
  }, [layers]);

  const draw = useCallback(() => {
    const s = state.current;
    const depth = product.sink * PX_PER_CM * s.pressure;
    const sigma = 48 + (10 - product.firmness) * 9;
    const dip = (x: number) => depth * Math.exp(-((x - s.x) ** 2) / (2 * sigma * sigma));
    const edge = (x: number) => 12 * (1 - smoothstep(0, 26, Math.min(x - X0, X1 - x)));
    const curve = (k: number) => {
      const pts: string[] = [];
      for (let x = X0; x <= X1; x += STEP) pts.push(`${x},${(bounds[k] + dip(x) * carry[k] + (k === 0 ? edge(x) : 0)).toFixed(1)}`);
      return pts;
    };
    const lines = bounds.map((_, k) => curve(k));
    layers.forEach((_, k) => {
      const top = lines[k];
      const bottom = [...lines[k + 1]].reverse();
      bands.current[k]?.setAttribute("d", `M${top.join(" L")} L${bottom.join(" L")} Z`);
    });
    const surf = TOP + dip(s.x);
    palm.current?.setAttribute("transform", `translate(${s.x} ${surf - 30})`);
    glow.current?.setAttribute("cx", String(s.x));
    glow.current?.setAttribute("cy", String(surf + 6));
    glow.current?.setAttribute("rx", String(sigma * 1.3));
    glow.current?.setAttribute("opacity", String(0.55 * s.pressure));
  }, [product, bounds, carry, layers]);

  const loop = useCallback(
    (t: number) => {
      const s = state.current;
      const dt = Math.min(0.05, (t - (s.last || t)) / 1000);
      s.last = t;
      // Sinking takes a soft half-second; rising takes as long as the material wants.
      const tau = s.target > s.pressure ? 0.28 : product.recovery / 2.2;
      s.pressure += (s.target - s.pressure) * (1 - Math.exp(-dt / tau));
      draw();
      setReadout(Math.round(product.sink * s.pressure * 10) / 10);
      if (Math.abs(s.target - s.pressure) > 0.002) s.raf = requestAnimationFrame(loop);
      else {
        s.pressure = s.target;
        s.raf = 0;
        s.last = 0;
        draw();
      }
    },
    [draw, product]
  );

  const kick = useCallback(() => {
    if (!state.current.raf) state.current.raf = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const s = state.current;
    return () => cancelAnimationFrame(s.raf);
  }, []);

  // A new mattress: restart the loop with its own recovery speed.
  useEffect(() => {
    cancelAnimationFrame(state.current.raf);
    state.current.raf = 0;
    state.current.last = 0;
    kick();
  }, [kick]);

  const toLocalX = (clientX: number) => {
    const r = svg.current!.getBoundingClientRect();
    return Math.min(X1 - 30, Math.max(X0 + 30, ((clientX - r.left) / r.width) * VW));
  };

  const press = (on: boolean) => {
    state.current.target = on ? 1 : 0;
    if (on) setHint(false);
    kick();
  };

  return (
    <div className={cn(dark ? "text-pearl" : "text-ink")}>
      <div role="tablist" aria-label="Choose a mattress to feel" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {PRODUCTS.map((p) => (
          <button
            key={p.slug}
            role="tab"
            aria-selected={p.slug === slug}
            onClick={() => setSlug(p.slug)}
            className={cn(
              "shrink-0 border px-4 py-2.5 text-left transition-all duration-700 ease-silk",
              p.slug === slug ? (dark ? "border-gold bg-gold/15" : "border-midnight bg-midnight text-pearl") : dark ? "border-pearl/15 hover:border-gold/60" : "border-ink/15 hover:border-gold"
            )}
          >
            <span className="block text-sm">{p.name.replace("The ", "")}</span>
            <span className={cn("block text-[0.65rem] uppercase tracking-[0.2em]", p.slug === slug ? "text-gold" : "opacity-60")}>{p.firmnessLabel}</span>
          </button>
        ))}
      </div>

      <div
        className="relative mt-8 cursor-grab touch-none select-none rounded-sm outline-none active:cursor-grabbing"
        tabIndex={0}
        role="group"
        aria-label={`Firmness simulator for ${product.name}. Use left and right arrows to move your hand, hold Space to press.`}
        onPointerMove={(e) => {
          state.current.x = toLocalX(e.clientX);
          if (!state.current.raf) draw();
        }}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          state.current.x = toLocalX(e.clientX);
          press(true);
        }}
        onPointerUp={() => press(false)}
        onPointerCancel={() => press(false)}
        onPointerLeave={(e) => e.pointerType === "mouse" && press(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            state.current.x = Math.min(X1 - 30, Math.max(X0 + 30, state.current.x + (e.key === "ArrowLeft" ? -30 : 30)));
            if (!state.current.raf) draw();
          }
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            press(true);
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") press(false);
        }}
      >
        <svg ref={svg} viewBox={`0 0 ${VW} 350`} className="w-full" aria-hidden>
          <defs>
            <pattern id="sim-quilt" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="28" height="28" fill="#f4eee4" />
              <path d="M0 0H28M0 0V28" stroke="#d8cdbb" strokeWidth="1" />
            </pattern>
            <pattern id="sim-coils" width="26" height="60" patternUnits="userSpaceOnUse">
              <rect width="26" height="60" fill="#262d3d" />
              <path d="M13 2 C22 6 4 10 13 14 C22 18 4 22 13 26 C22 30 4 34 13 38 C22 42 4 46 13 50 C22 54 4 58 13 60" stroke="#c7bfb2" strokeWidth="1.3" fill="none" />
            </pattern>
            <radialGradient id={`palm-${uid}`} cx="40%" cy="35%">
              <stop offset="0%" stopColor="#f7e8dc" />
              <stop offset="100%" stopColor="#d9b8a8" />
            </radialGradient>
            <radialGradient id={`glow-${uid}`}>
              <stop offset="0%" stopColor="#c9a96e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#c9a96e" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="400" cy="330" rx="370" ry="14" fill="#0e1420" opacity="0.18" />
          <line x1={X0} x2={X1} y1={TOP} y2={TOP} stroke={dark ? "#f5f0e8" : "#1c2230"} strokeOpacity="0.25" strokeDasharray="3 6" />
          {layers.map((l, k) => (
            <path key={`${slug}-${k}`} ref={(el) => void (bands.current[k] = el)} fill={FILL[layerKind(l, k)]} stroke="#0e1420" strokeOpacity="0.12" strokeWidth="1" />
          ))}
          <ellipse ref={glow} cy={TOP} rx="80" ry="10" fill={`url(#glow-${uid})`} opacity="0" />
          <g ref={palm} transform={`translate(400 ${TOP - 30})`}>
            <ellipse cx="0" cy="34" rx="30" ry="5" fill="#0e1420" opacity="0.15" />
            <circle r="28" fill={`url(#palm-${uid})`} stroke="#fff" strokeOpacity="0.6" />
            <circle r="28" fill="none" stroke="#c9a96e" strokeOpacity="0.6" strokeDasharray="2 5" />
          </g>
        </svg>

        {hint && (
          <p className={cn("pointer-events-none absolute -top-6 left-1/2 w-full -translate-x-1/2 text-center text-xs uppercase tracking-[0.25em] motion-safe:animate-pulse", dark ? "text-pearl/60" : "text-stone")}>
            Press and hold the mattress
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-3" aria-live="polite">
        <div>
          <p className={cn("eyebrow", dark ? "text-pearl/50" : "text-stone")}>Sink depth</p>
          <p className="mt-1 font-serif text-4xl tabular-nums">
            {readout.toFixed(1)}
            <span className="ml-1 text-lg opacity-60">cm</span>
          </p>
        </div>
        <div>
          <p className={cn("eyebrow", dark ? "text-pearl/50" : "text-stone")}>The feeling</p>
          <p className="mt-1 font-serif text-2xl italic">{product.feeling}</p>
          <p className={cn("text-xs", dark ? "text-pearl/55" : "text-stone")}>
            {product.recovery > 1.2 ? "Slow, cradling return" : product.recovery > 0.7 ? "Gentle, balanced return" : "Buoyant, instant lift"}
          </p>
        </div>
        <div>
          <p className={cn("eyebrow mb-3", dark ? "text-pearl/50" : "text-stone")}>{product.firmnessLabel}</p>
          <FirmnessScale value={product.firmness} dark={dark} />
        </div>
      </div>
    </div>
  );
}
