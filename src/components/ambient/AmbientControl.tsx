"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useAccount, type SoundId } from "@/lib/account";
import { ambient } from "@/lib/ambient";
import { track } from "@/lib/analytics";
import { EASE, cn } from "@/lib/utils";

const SOUNDS: { id: SoundId; label: string; note: string }[] = [
  { id: "rain", label: "Soft rain", note: "A monsoon night on the window" },
  { id: "ocean", label: "Ocean", note: "Slow tide, far away" },
  { id: "noise", label: "Hush", note: "Gentle, even white noise" },
];

/** Four fine bars that sway while sound plays. */
function Wave({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-4 items-center gap-[3px]" aria-hidden>
      {[0.5, 1, 0.7, 0.9].map((h, i) => (
        <motion.span
          key={i}
          className="w-px rounded-full bg-current"
          animate={playing ? { height: ["30%", `${h * 100}%`, "40%", `${h * 80}%`, "30%"] } : { height: "25%" }}
          transition={playing ? { duration: 1.6 + i * 0.25, repeat: Infinity, ease: "easeInOut" } : { duration: 0.6 }}
          style={{ height: "25%" }}
        />
      ))}
    </span>
  );
}

/** Ambient sound: always off until chosen, and remembered only as a preference, never autoplayed. */
export function AmbientControl() {
  const sound = useAccount((s) => s.sound);
  const setSound = useAccount((s) => s.setSound);
  const volume = useAccount((s) => s.volume);
  const setVolume = useAccount((s) => s.setVolume);
  const [playing, setPlaying] = useState<SoundId | null>(null);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => () => ambient?.stop(), []);

  const play = (id: SoundId) => {
    ambient.play(id, volume);
    setPlaying(id);
    setSound(id);
    track("ambient_sound", { sound: id });
  };
  const stop = () => {
    ambient.stop();
    setPlaying(null);
  };

  return (
    <div ref={wrap} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={playing ? `Ambient sound: ${SOUNDS.find((s) => s.id === playing)?.label}. Change or stop` : "Ambient sound, off"}
        className={cn("grid h-11 w-11 place-items-center transition-colors duration-700", playing && "text-gold-ink")}
      >
        <Wave playing={!!playing} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Ambient sound"
            className="glass absolute right-0 top-12 z-50 w-72 rounded-xl p-4 text-ink shadow-lift"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="eyebrow text-stone">Sounds for sleep</p>
            <ul className="mt-3 space-y-1">
              {SOUNDS.map((s) => (
                <li key={s.id}>
                  <button onClick={() => (playing === s.id ? stop() : play(s.id))} aria-pressed={playing === s.id} className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors duration-500", playing === s.id ? "bg-midnight text-pearl" : "hover:bg-ink/5")}>
                    <span>
                      <span className="block font-serif text-lg leading-tight">{s.label}</span>
                      <span className={cn("block text-xs", playing === s.id ? "text-pearl/60" : "text-stone")}>{s.note}</span>
                    </span>
                    {playing === s.id ? <Wave playing /> : sound === s.id ? <span className="text-[0.6rem] uppercase tracking-[0.2em] text-stone">Last</span> : null}
                  </button>
                </li>
              ))}
            </ul>
            <label className="mt-4 flex items-center gap-3 px-1 text-xs text-stone">
              Volume
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => {
                  setVolume(+e.target.value);
                  ambient.setVolume(+e.target.value);
                }}
                className="flex-1 text-ink"
              />
            </label>
            {playing && (
              <button onClick={stop} className="mt-3 w-full rounded-lg border border-ink/15 py-2 text-xs uppercase tracking-[0.2em] hover:border-gold">
                Silence
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
