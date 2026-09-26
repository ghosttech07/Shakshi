"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SHOWROOMS } from "@/lib/products";
import { EASE, cn } from "@/lib/utils";
import { Img } from "@/components/ui/Img";
import { IconPin, IconPhone, IconClock, IconArrow } from "@/components/ui/Icons";

// Project India's rough bounding box onto the constellation panel.
const project = (lat: number, lng: number) => ({ x: ((lng - 68) / (90 - 68)) * 100, y: ((36 - lat) / (36 - 7)) * 100 });

export function Showrooms({ active, onSelect: setActive, onBook }: { active: string; onSelect: (id: string) => void; onBook: (id: string) => void }) {
  const s = SHOWROOMS.find((x) => x.id === active)!;
  const pts = SHOWROOMS.map((x) => ({ ...x, ...project(x.lat, x.lng) }));
  const bbox = `${s.lng - 0.02},${s.lat - 0.012},${s.lng + 0.02},${s.lat + 0.012}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="relative overflow-hidden bg-midnight p-6 text-pearl linen-dark sm:p-8">
        <p className="eyebrow text-gold">Our salons</p>
        <div className="relative mx-auto mt-6 aspect-square max-w-md">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
            {Array.from({ length: 60 }).map((_, i) => (
              <circle key={i} cx={(i * 37) % 100} cy={(i * 61) % 100} r={0.25 + ((i * 7) % 5) / 20} fill="#f5f0e8" opacity={0.15 + ((i * 13) % 10) / 40} />
            ))}
            <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#c9a96e" strokeOpacity=".35" strokeWidth=".3" strokeDasharray="1 1.5" />
          </svg>
          <ul className="absolute inset-0">
            {pts.map((p) => (
              <li key={p.id} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <button onClick={() => setActive(p.id)} aria-pressed={active === p.id} className="group relative -translate-x-1/2 -translate-y-1/2 p-3" aria-label={`${p.city} salon`}>
                  <span className={cn("block h-3 w-3 rounded-full transition-all duration-700", active === p.id ? "scale-125 bg-gold shadow-[0_0_24px_6px_rgb(201_169_110/0.5)]" : "bg-pearl/70 group-hover:bg-gold-soft")} />
                  <span className={cn("absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-lg transition-colors duration-700", active === p.id ? "text-gold" : "text-pearl/70")}>{p.city}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.article key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.8, ease: EASE }} className="flex flex-col bg-ivory-2/60">
          <Img src={s.image} alt={`Inside the ${s.name}`} sizes="(min-width: 1024px) 45vw, 100vw" wrapperClassName="aspect-[16/9]" />
          <div className="flex flex-1 flex-col p-6 sm:p-8">
            <h3 className="display text-3xl sm:text-4xl">{s.name}</h3>
            <ul className="mt-5 space-y-2.5 text-sm text-stone">
              <li className="flex gap-3"><IconPin size={18} className="shrink-0 text-gold-ink" /> {s.address}</li>
              <li className="flex gap-3"><IconClock size={18} className="shrink-0 text-gold-ink" /> {s.hours}</li>
              <li className="flex gap-3"><IconPhone size={18} className="shrink-0 text-gold-ink" /> <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-ink">{s.phone}</a></li>
            </ul>
            <div className="mt-6 aspect-[16/7] overflow-hidden border border-ink/10">
              <iframe
                title={`Map showing ${s.name}`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${s.lat},${s.lng}`}
                loading="lazy"
                className="h-full w-full [filter:grayscale(0.9)_sepia(0.25)_contrast(0.95)]"
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <button className="btn btn-dark" onClick={() => onBook(s.id)}>
                Book a visit here
              </button>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 self-center text-xs font-semibold uppercase tracking-[0.2em] hover:text-gold-ink">
                Directions <IconArrow size={14} />
              </a>
            </div>
          </div>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
