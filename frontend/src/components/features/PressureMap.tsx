"use client";

import { motion } from "framer-motion";
import { useId } from "react";
import type { Answers } from "@shakshi/shared/quiz";
import type { Product } from "@shakshi/shared/products";
import { EASE, clamp } from "@shakshi/shared/utils";

type Zone = "shoulders" | "lowerBack" | "hips";

// The firmness each part of the body asks for, by sleeping position (1 plush → 10 firm).
const IDEAL: Record<NonNullable<Answers["position"]>, Record<Zone, number>> = {
  side: { shoulders: 3.5, lowerBack: 5.5, hips: 5 },
  back: { shoulders: 5.5, lowerBack: 6.5, hips: 6.5 },
  stomach: { shoulders: 6.5, lowerBack: 7.5, hips: 7.5 },
  combination: { shoulders: 5, lowerBack: 6, hips: 6 },
};

const ZONES: { id: Zone; label: string; y: number; rx: number; ry: number }[] = [
  { id: "shoulders", label: "Shoulders", y: 92, rx: 46, ry: 20 },
  { id: "lowerBack", label: "Lower back", y: 150, rx: 30, ry: 16 },
  { id: "hips", label: "Hips", y: 184, rx: 40, ry: 20 },
];

// Sequential single-hue ramp (light → dark gold): darker means more pressure concentrated there.
const RAMP = ["#f2e5c8", "#e6cb95", "#d6ab62", "#bf8a39", "#9a6a1c"];
const rampAt = (t: number) => RAMP[Math.round(clamp(t, 0, 1) * (RAMP.length - 1))];

export function supportFor(p: Product, a: Answers) {
  const ideal = IDEAL[a.position ?? "combination"];
  const bodyShift = a.body === "petite" ? -1 : a.body === "broad" ? 1 : 0;
  const zoned = p.slug === "signature" || p.slug === "sovereign";
  return ZONES.map((z) => {
    const diff = p.firmness - (ideal[z.id] + bodyShift);
    let fit = 100 - Math.abs(diff) * 13;
    if (z.id === "lowerBack" && zoned) fit += 5;
    fit = Math.round(clamp(fit, 55, 99));
    const note =
      Math.abs(diff) <= 1
        ? { shoulders: "Cradled: the shoulder sinks just enough", lowerBack: "Aligned: the natural curve is filled", hips: "Supported: hips held level" }[z.id]
        : diff > 0
          ? { shoulders: "A little firm for this position", lowerBack: "Firm, upright support", hips: "Firm under the hips" }[z.id]
          : { shoulders: "Deep, plush relief", lowerBack: "Soft; relies on the spring core", hips: "Hips sink a little deeper" }[z.id];
    return { ...z, fit, pressure: (100 - fit) / 45, note };
  });
}

/** A top-down pressure map of a sleeper on the recommended mattress. */
export function PressureMap({ product, answers }: { product: Product; answers: Answers }) {
  const uid = useId().replace(/:/g, "");
  const zones = supportFor(product, answers);
  const side = answers.position === "side";
  const stomach = answers.position === "stomach";
  const summary = zones.map((z) => `${z.label} ${z.fit}% support`).join(", ");

  return (
    <div className="grid items-center gap-8 sm:grid-cols-[220px_1fr]">
      <svg viewBox="0 0 160 330" className="mx-auto w-[180px] sm:w-full" role="img" aria-label={`Pressure map for ${product.name}: ${summary}`}>
        <defs>
          <filter id={`blur-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <clipPath id={`body-${uid}`}>
            {side ? (
              <path d="M80 18a20 20 0 1 1 0 40a20 20 0 1 1 0-40ZM62 62h36q10 0 12 14l2 80q1 30-8 44l6 50q4 20-6 44h-14l-4-50-8 50H64q-10-26-4-50l6-46q-10-12-10-40l0-82q2-14 6-14Z" />
            ) : (
              <path
                d={
                  stomach
                    ? "M80 34a20 20 0 1 1 0 40a20 20 0 1 1 0-40ZM44 10l14 60h44l14-60 10 4-12 66q12 6 12 20v70q0 14-8 24l4 104h-20l-6-100h-4l-6 100H64l4-104q-8-10-8-24v-70q0-14 12-20L30 14Z"
                    : "M80 18a20 20 0 1 1 0 40a20 20 0 1 1 0-40ZM48 64h64q14 2 16 18l8 96-10 2-12-84v84q0 14-8 24l4 104h-20l-6-100h-8l-6 100H50l4-104q-8-10-8-24V96l-12 84-10-2 8-96q2-16 16-18Z"
                }
              />
            )}
          </clipPath>
        </defs>
        {/* Mattress, seen from above */}
        <rect x="4" y="4" width="152" height="322" rx="14" fill="#efe8dc" stroke="#c9a96e" strokeOpacity=".5" />
        <rect x="12" y="12" width="136" height="306" rx="9" fill="none" stroke="#1c2230" strokeOpacity=".08" strokeDasharray="3 5" />
        {/* The sleeper */}
        <g clipPath={`url(#body-${uid})`}>
          <rect width="160" height="330" fill={RAMP[0]} />
          <g filter={`url(#blur-${uid})`}>
            {zones.map((z, i) => (
              <motion.ellipse
                key={z.id}
                cx="80"
                cy={z.y}
                rx={z.rx}
                ry={z.ry}
                fill={rampAt(z.pressure)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.4, delay: 0.5 + i * 0.25, ease: EASE }}
              />
            ))}
          </g>
        </g>
      </svg>

      <div>
        <ul className="space-y-5">
          {zones.map((z, i) => (
            <li key={z.id}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-serif text-xl">{z.label}</p>
                <p className="text-sm tabular-nums">{z.fit}% support</p>
              </div>
              <div className="mt-2 h-[3px] rounded-full bg-ink/10">
                <motion.div className="h-full rounded-full bg-chart" initial={{ width: 0 }} animate={{ width: `${z.fit}%` }} transition={{ duration: 1.4, delay: 0.4 + i * 0.2, ease: EASE }} />
              </div>
              <p className="mt-1.5 text-xs text-stone">{z.note}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.18em] text-stone" aria-hidden>
          <span>Even support</span>
          <span className="flex">
            {RAMP.map((c) => (
              <span key={c} className="h-2 w-6 first:rounded-l-full last:rounded-r-full" style={{ background: c }} />
            ))}
          </span>
          <span>Pressure point</span>
        </div>
      </div>
    </div>
  );
}
