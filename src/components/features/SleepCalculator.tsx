"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { EASE, cn } from "@/lib/utils";
import { IconMoon, IconClock } from "@/components/ui/Icons";

const CYCLE = 90;
const FALL_ASLEEP = 15;

const fmt = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

function Hypnogram({ cycles }: { cycles: number }) {
  // Each 90-minute cycle dips into deep sleep and rises toward dreaming.
  const w = 600;
  const seg = w / 6;
  let d = "M0 12";
  for (let i = 0; i < cycles; i++) {
    const x = i * seg;
    const depth = 60 - i * 7;
    d += ` C${x + seg * 0.2} 12, ${x + seg * 0.25} ${12 + depth}, ${x + seg * 0.45} ${12 + depth} S${x + seg * 0.8} 14, ${x + seg} 12`;
  }
  return (
    <svg viewBox={`0 0 ${w} 80`} className="h-16 w-full" aria-hidden preserveAspectRatio="none">
      <motion.path d={d} fill="none" stroke="#c9a96e" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EASE }} key={cycles} />
      {Array.from({ length: cycles }).map((_, i) => (
        <circle key={i} cx={(i + 1) * seg} cy={12} r={3} fill="#c9a96e" />
      ))}
    </svg>
  );
}

export function SleepCalculator() {
  const [mode, setMode] = useState<"wake" | "now">("wake");
  const [wake, setWake] = useState("06:30");
  const [nowKey, setNowKey] = useState(0);
  // Times depend on the visitor's clock and locale, so they are drawn in the browser only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const results = useMemo(() => {
    void nowKey;
    const now = new Date();
    if (mode === "wake") {
      const [h, m] = wake.split(":").map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      return [6, 5, 4, 3].map((c) => ({ cycles: c, time: new Date(target.getTime() - (c * CYCLE + FALL_ASLEEP) * 60000) }));
    }
    return [6, 5, 4, 3].map((c) => ({ cycles: c, time: new Date(now.getTime() + (c * CYCLE + FALL_ASLEEP) * 60000) }));
  }, [mode, wake, nowKey]);

  return (
    <div>
      <div role="tablist" aria-label="Calculator mode" className="inline-flex border border-ink/15 p-1">
        {[
          { id: "wake" as const, label: "I need to wake at…" },
          { id: "now" as const, label: "I'm going to bed now" },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={mode === t.id}
            onClick={() => {
              setMode(t.id);
              setNowKey((k) => k + 1);
            }}
            className={cn("px-4 py-2.5 text-sm transition-colors duration-700 sm:px-5", mode === t.id ? "bg-midnight text-pearl" : "hover:text-gold-ink")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === "wake" && (
        <label className="mt-8 flex items-end gap-4">
          <IconClock size={28} className="mb-2 text-gold-ink" />
          <span className="flex-1">
            <span className="eyebrow block text-stone">Wake-up time</span>
            <input type="time" value={wake} onChange={(e) => e.target.value && setWake(e.target.value)} className="field font-serif text-4xl" />
          </span>
        </label>
      )}

      <p className="mt-8 text-sm text-stone">
        {mode === "wake" ? "Fall asleep at one of these times to wake gently between cycles:" : "Set your alarm for one of these times to wake between cycles:"}{" "}
        <span className="text-ink/70">(we allow 15 minutes to drift off)</span>
      </p>

      <ul className="mt-6 grid min-h-[300px] gap-3 sm:grid-cols-2" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {mounted && results.map((r, i) => {
            const ideal = r.cycles >= 5;
            return (
              <motion.li
                key={`${mode}-${wake}-${r.cycles}-${nowKey}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }}
                className={cn("border p-5", ideal ? "border-gold/60 bg-gold/[0.07]" : "border-ink/10")}
              >
                <div className="flex items-baseline justify-between">
                  <p className="font-serif text-4xl">{fmt(r.time)}</p>
                  {ideal && (
                    <span className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-ink">
                      <IconMoon size={14} /> {r.cycles === 6 ? "Ideal" : "Restorative"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-stone">
                  {r.cycles} cycles · {(r.cycles * CYCLE) / 60} hours of sleep
                </p>
                <Hypnogram cycles={r.cycles} />
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
