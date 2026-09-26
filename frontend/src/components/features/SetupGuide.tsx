"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { useAccount } from "@/lib/account";
import { useHydrated } from "@/lib/useHydrated";
import { cn } from "@shakshi/shared/utils";

const Art = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 200 130" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="10" y1="118" x2="190" y2="118" opacity=".3" />
    {children}
  </svg>
);

const STEPS: { title: string; body: string; art: ReactNode }[] = [
  {
    title: "Bring it to the bedroom",
    body: "Carry the box, still sealed, to the room it will live in. It's heavy and flexible, so two people make light work of it.",
    art: <Art><rect x="55" y="52" width="90" height="66" rx="3" /><path d="M55 70h90M100 52v18" /><path d="M36 96c6-10 14-14 19-14M164 96c-6-10-14-14-19-14" opacity=".6" /></Art>,
  },
  {
    title: "Open along the tear strip",
    body: "Pull the gold ribbon across the top. Please keep knives away from the fabric inside.",
    art: <Art><rect x="55" y="52" width="90" height="66" rx="3" /><motion.path d="M58 60h84" stroke="#c9a96e" strokeWidth="2.4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1 }} /></Art>,
  },
  {
    title: "Unroll onto the frame",
    body: "Lift the roll onto your bed frame with the Shakshi label at the foot, then unroll it towards the headboard.",
    art: <Art><rect x="30" y="100" width="140" height="10" rx="2" /><motion.g initial={{ x: 0 }} animate={{ x: 90 }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.8, ease: [0.65, 0, 0.35, 1] }}><circle cx="45" cy="88" r="12" /><circle cx="45" cy="88" r="5" /></motion.g></Art>,
  },
  {
    title: "Release the inner wrap",
    body: "Snip the inner film at one corner only, then peel it away. You'll hear a soft sigh as the mattress starts to breathe.",
    art: <Art><rect x="30" y="86" width="140" height="18" rx="4" /><motion.path d="M30 86c30-14 80-14 140 0" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -18 }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} /></Art>,
  },
  {
    title: "Let it rise",
    body: "Open a window. It's comfortable to sleep on after a couple of hours, and fully expanded within a day.",
    art: <Art><motion.rect x="30" width="140" rx="4" initial={{ y: 98, height: 8 }} animate={{ y: 78, height: 28 }} transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: [0.65, 0, 0.35, 1] }} /><path d="M60 40c10-6 20 6 30 0s20-6 30 0M80 26c8-5 16 5 24 0" opacity=".5" /></Art>,
  },
  {
    title: "Dress it, and rest",
    body: "Add your protector and linen. Register your warranty from your account, and sleep well tonight.",
    art: <Art><rect x="30" y="80" width="140" height="26" rx="5" /><rect x="40" y="68" width="42" height="14" rx="7" /><rect x="90" y="68" width="42" height="14" rx="7" /><path d="M30 92h140" opacity=".4" /></Art>,
  },
];

const STEP_MS = 5200;

/** An unboxing film: a real video if one is configured, otherwise six illustrated scenes that play in turn. */
export function UnboxingFilm() {
  const video = process.env.NEXT_PUBLIC_UNBOXING_VIDEO_URL;
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(!reduce);

  useEffect(() => {
    if (!playing || video) return;
    const t = setTimeout(() => setI((v) => (v + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [i, playing, video]);

  if (video)
    return (
      <video src={video} controls playsInline preload="metadata" className="aspect-video w-full bg-midnight">
        <track kind="captions" />
      </video>
    );

  const s = STEPS[i];
  return (
    <div className="overflow-hidden bg-midnight text-pearl linen-dark">
      <div className="grid min-h-[340px] items-center gap-8 p-8 sm:grid-cols-[1fr_1fr] sm:p-12">
        <div className="h-40 text-gold sm:h-56" aria-hidden>
          <AnimatePresence mode="wait">
            <motion.div key={i} className="h-full" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}>
              {s.art}
            </motion.div>
          </AnimatePresence>
        </div>
        <div aria-live="polite">
          <p className="eyebrow text-gold">Step {i + 1} of {STEPS.length}</p>
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}>
              <h3 className="mt-3 text-3xl sm:text-4xl">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-pearl/70">{s.body}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center gap-4 border-t border-pearl/10 px-6 py-4">
        <button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"} className="grid h-9 w-9 place-items-center rounded-full border border-pearl/25 hover:border-gold">
          {playing ? <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden><rect width="3" height="12" /><rect x="7" width="3" height="12" /></svg> : <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor" aria-hidden><path d="M0 0l10 6-10 6z" /></svg>}
        </button>
        <div className="flex flex-1 gap-1.5">
          {STEPS.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Go to step ${k + 1}`} className="h-6 flex-1">
              <span className="block h-[2px] overflow-hidden bg-pearl/15">
                <motion.span
                  key={`${k}-${i}-${playing}`}
                  className="block h-full bg-gold"
                  initial={{ width: k < i ? "100%" : "0%" }}
                  animate={{ width: k < i ? "100%" : k === i && playing ? "100%" : k === i ? "50%" : "0%" }}
                  transition={{ duration: k === i && playing ? STEP_MS / 1000 : 0.3, ease: "linear" }}
                />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const MILESTONES = [
  { h: 0, label: "Unrolled", note: "Air is finding its way back into every layer." },
  { h: 2, label: "Ready tonight", note: "Comfortable to sleep on, though still settling." },
  { h: 12, label: "Nearly there", note: "Edges and corners have filled out." },
  { h: 24, label: "Fully expanded", note: "Your mattress is at its full height. Sleep well." },
];

/** "Your mattress is expanding": a 24-hour countdown from the moment it's unrolled. */
export function ExpansionTimer() {
  const hydrated = useHydrated();
  const unrolledAt = useAccount((s) => s.unrolledAt);
  const setUnrolled = useAccount((s) => s.setUnrolled);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!unrolledAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [unrolledAt]);

  if (!hydrated) return <div className="skeleton h-72" />;
  const start = unrolledAt ? new Date(unrolledAt).getTime() : null;
  const elapsed = start ? Math.max(0, now - start) : 0;
  const total = 24 * 3600 * 1000;
  const left = Math.max(0, total - elapsed);
  const pct = start ? Math.min(1, elapsed / total) : 0;
  const hh = Math.floor(left / 3600000);
  const mm = Math.floor((left % 3600000) / 60000);
  const ss = Math.floor((left % 60000) / 1000);
  const r = 88;
  const c = 2 * Math.PI * r;
  const hours = elapsed / 3600000;
  const current = [...MILESTONES].reverse().find((m) => hours >= m.h) ?? MILESTONES[0];

  return (
    <div className="grid items-center gap-10 md:grid-cols-[auto_1fr]">
      <div className="relative mx-auto h-56 w-56">
        <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="img" aria-label={start ? `${Math.round(pct * 100)}% expanded` : "Not started"}>
          <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth="3" />
          <circle cx="100" cy="100" r={r} fill="none" stroke="#c9a96e" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - pct * c} style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          {start ? (
            left > 0 ? (
              <p>
                <span className="block font-serif text-4xl tabular-nums">
                  {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-stone">until fully risen</span>
              </p>
            ) : (
              <p className="font-serif text-3xl">Fully risen</p>
            )
          ) : (
            <p className="px-8 text-sm text-stone">Start the clock when you release the inner wrap.</p>
          )}
        </div>
      </div>
      <div>
        <p className="eyebrow text-gold-ink">{start ? current.label : "Your mattress is expanding"}</p>
        <p className="mt-3 font-serif text-3xl leading-snug">{start ? current.note : "It needs a day to reach its full, generous height."}</p>
        <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Milestones">
          {MILESTONES.map((m) => (
            <li key={m.h} className={cn("border-t-2 pt-2 text-xs transition-colors duration-700", start && hours >= m.h ? "border-gold text-ink" : "border-ink/15 text-stone")}>
              <span className="block font-semibold">{m.h}h</span>
              {m.label}
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-4">
          {!start ? (
            <button onClick={() => setUnrolled(new Date().toISOString())} className="btn btn-gold">
              I&rsquo;ve just unrolled it
            </button>
          ) : (
            <button onClick={() => setUnrolled(null)} className="text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">
              Reset the clock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
