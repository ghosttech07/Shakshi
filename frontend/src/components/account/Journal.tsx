"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { useAccount, type JournalEntry } from "@/lib/account";
import { EASE, cn } from "@shakshi/shared/utils";
import { IconMoon } from "@/components/ui/Icons";

const QUALITY = ["Restless", "Light", "Fair", "Rested", "Restored"];
const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

/**
 * Sleep quality over the last few weeks: one series, so no legend; the title names it.
 * 2px line, a hover crosshair with tooltip, recessive grid, and a table view for screen readers.
 */
function TrendChart({ entries }: { entries: JournalEntry[] }) {
  const data = entries.slice(-21);
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const W = 640;
  const H = 220;
  const pad = { l: 34, r: 12, t: 14, b: 28 };
  const x = (i: number) => pad.l + (data.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (data.length - 1)) * (W - pad.l - pad.r));
  const y = (q: number) => pad.t + ((5 - q) / 4) * (H - pad.t - pad.b);
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.quality).toFixed(1)}`).join(" ");
  const area = `${path} L${x(data.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    data.forEach((_, i) => Math.abs(x(i) - px) < Math.abs(x(best) - px) && (best = i));
    setHover(best);
  };
  const h = hover !== null ? data[hover] : null;

  return (
    <figure className="relative">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="w-full touch-none" role="img" aria-label={`Sleep quality over your last ${data.length} logged nights`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {[1, 2, 3, 4, 5].map((q) => (
          <g key={q}>
            <line x1={pad.l} x2={W - pad.r} y1={y(q)} y2={y(q)} stroke="currentColor" strokeOpacity={q === 1 ? 0.2 : 0.07} />
            <text x={pad.l - 10} y={y(q) + 4} textAnchor="end" fontSize="11" fill="currentColor" fillOpacity=".55">
              {q}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2) ? (
            <text key={d.date} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fontSize="11" fill="currentColor" fillOpacity=".55">
              {shortDate.format(new Date(d.date))}
            </text>
          ) : null
        )}
        <path d={area} fill="var(--color-chart)" fillOpacity=".08" />
        <motion.path d={path} fill="none" stroke="var(--color-chart)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: EASE }} key={path} />
        {/* The most recent night is always marked */}
        <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].quality)} r="4.5" fill="var(--color-chart)" stroke="var(--color-ivory)" strokeWidth="2" />
        {h && hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="currentColor" strokeOpacity=".25" strokeDasharray="3 4" />
            <circle cx={x(hover)} cy={y(h.quality)} r="5" fill="var(--color-chart)" stroke="var(--color-ivory)" strokeWidth="2" />
          </g>
        )}
      </svg>
      <AnimatePresence>
        {h && hover !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="glass pointer-events-none absolute top-0 rounded-lg px-3 py-2 text-xs text-ink shadow-soft"
            style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 70px), calc(100% - 140px))` }}
          >
            <p className="font-semibold">{shortDate.format(new Date(h.date))}</p>
            <p>
              {QUALITY[h.quality - 1]} ({h.quality}/5) · {h.hours} h
            </p>
            {h.note && <p className="max-w-[12rem] truncate text-stone">{h.note}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </figure>
  );
}

export function Journal() {
  const journal = useAccount((s) => s.journal);
  const logSleep = useAccount((s) => s.logSleep);
  const removeSleep = useAccount((s) => s.removeSleep);
  const [date, setDate] = useState(today());
  const [quality, setQuality] = useState(4);
  const [hours, setHours] = useState(7.5);
  const [note, setNote] = useState("");
  const [table, setTable] = useState(false);
  const [saved, setSaved] = useState(false);

  const recent = journal.slice(-7);
  const stats = useMemo(
    () => ({
      quality: recent.length ? recent.reduce((s, j) => s + j.quality, 0) / recent.length : 0,
      hours: recent.length ? recent.reduce((s, j) => s + j.hours, 0) / recent.length : 0,
    }),
    [recent]
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    logSleep({ date, quality, hours, note: note.trim() || undefined });
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const addSampleWeek = () => {
    const base = Date.now();
    [3, 3, 4, 4, 3, 5, 4, 5, 4, 5].forEach((q, i) => {
      const d = new Date(base - (10 - i) * 86400000).toLocaleDateString("en-CA");
      logSleep({ date: d, quality: q, hours: 6 + q * 0.4 + (i % 3) * 0.2, note: i === 9 ? "Slept straight through the storm." : undefined });
    });
  };

  return (
    <section id="journal" className="scroll-mt-28" aria-labelledby="journal-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="journal-title" className="display text-4xl">
            Sleep journal
          </h2>
          <p className="mt-2 text-sm text-stone">One line each morning. Patterns appear within a fortnight.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="border border-ink/10 bg-ivory p-6 sm:p-8">
          <label className="block">
            <span className="eyebrow text-stone">Night of</span>
            <input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} className="field" />
          </label>
          <fieldset className="mt-6">
            <legend className="eyebrow text-stone">How did you sleep?</legend>
            <div role="radiogroup" aria-label="Sleep quality" className="mt-3 flex gap-2">
              {QUALITY.map((q, i) => (
                <button type="button" key={q} role="radio" aria-checked={quality === i + 1} aria-label={q} title={q} onClick={() => setQuality(i + 1)} className={cn("grid h-11 flex-1 place-items-center rounded-full border transition-all duration-500", quality >= i + 1 ? "border-gold bg-gold/15 text-gold-ink" : "border-ink/15 text-ink/30")}>
                  <IconMoon size={18} />
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm">{QUALITY[quality - 1]}</p>
          </fieldset>
          <label className="mt-6 block">
            <span className="flex justify-between">
              <span className="eyebrow text-stone">Hours asleep</span>
              <span className="font-serif text-xl tabular-nums">{hours.toFixed(1)}</span>
            </span>
            <input type="range" min={3} max={11} step={0.25} value={hours} onChange={(e) => setHours(+e.target.value)} className="mt-2 w-full text-ink" />
          </label>
          <label className="mt-4 block">
            <span className="eyebrow text-stone">A note (optional)</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={140} placeholder="Late coffee, a storm, a dream…" className="field" />
          </label>
          <button type="submit" className="btn btn-dark mt-7 w-full">
            {saved ? "Saved. Sleep well tonight." : "Log this night"}
          </button>
        </form>

        <div className="border border-ink/10 p-6 sm:p-8">
          {journal.length ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow text-stone">Sleep quality, last {Math.min(21, journal.length)} nights</p>
                  <div className="mt-3 flex gap-8">
                    <p>
                      <span className="font-serif text-4xl tabular-nums">{stats.quality.toFixed(1)}</span>
                      <span className="block text-xs text-stone">avg quality, 7 nights</span>
                    </p>
                    <p>
                      <span className="font-serif text-4xl tabular-nums">{stats.hours.toFixed(1)}</span>
                      <span className="block text-xs text-stone">avg hours, 7 nights</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setTable(!table)} aria-pressed={table} className="text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">
                  {table ? "View chart" : "View as table"}
                </button>
              </div>
              <div className="mt-6">
                {table ? (
                  <div className="max-h-72 overflow-y-auto" data-lenis-prevent>
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">Sleep journal entries</caption>
                      <thead className="eyebrow text-stone">
                        <tr>
                          <th scope="col" className="pb-2 font-semibold">Night</th>
                          <th scope="col" className="pb-2 font-semibold">Quality</th>
                          <th scope="col" className="pb-2 font-semibold">Hours</th>
                          <th scope="col" className="pb-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {[...journal].reverse().map((j) => (
                          <tr key={j.date} className="border-t border-ink/10">
                            <td className="py-2">{shortDate.format(new Date(j.date))}</td>
                            <td>{QUALITY[j.quality - 1]}</td>
                            <td className="tabular-nums">{j.hours.toFixed(1)}</td>
                            <td className="text-right">
                              <button onClick={() => removeSleep(j.date)} className="text-xs text-stone hover:text-ink" aria-label={`Remove ${j.date}`}>
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <TrendChart entries={journal} />
                )}
              </div>
            </>
          ) : (
            <div className="grid h-full place-items-center py-10 text-center">
              <div>
                <IconMoon size={30} className="mx-auto text-gold-ink" />
                <p className="mt-4 font-serif text-2xl">Your first morning starts the story.</p>
                <p className="mt-2 text-sm text-stone">Log tonight&rsquo;s sleep tomorrow, and watch the trend take shape.</p>
                <button onClick={addSampleWeek} className="mt-5 text-xs uppercase tracking-[0.2em] text-gold-ink hover:text-ink">
                  Preview with sample nights
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
