"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAccount } from "@/lib/account";
import { Dialog } from "@/components/ui/Dialog";
import { REVIEWS, POSITION_LABELS, type Position, type Product, type Review } from "@/lib/products";
import { Stars } from "@/components/ui/Bits";
import { EASE, cn } from "@/lib/utils";
import { IconThumb, IconCheck, IconStar } from "@/components/ui/Icons";

const VOTES_KEY = "shakshi-helpful";
const BODY_LABELS = { petite: "Petite frame", average: "Average frame", broad: "Broad frame" } as const;
type Body = keyof typeof BODY_LABELS;

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

export function Reviews({ product, extra = [] }: { product: Product; extra?: Review[] }) {
  const [writing, setWriting] = useState(false);
  const [position, setPosition] = useState<Position | "all">("all");
  const [body, setBody] = useState<Body | "all">("all");
  const [withPhotos, setWithPhotos] = useState(false);
  const [sort, setSort] = useState<"helpful" | "recent">("helpful");
  const [voted, setVoted] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    try {
      setVoted(JSON.parse(localStorage.getItem(VOTES_KEY) ?? "[]"));
    } catch {}
  }, []);

  const vote = (id: string) => {
    if (voted.includes(id)) return;
    const next = [...voted, id];
    setVoted(next);
    try {
      localStorage.setItem(VOTES_KEY, JSON.stringify(next));
    } catch {}
  };

  const reviews = useMemo(() => {
    const list = [...extra, ...REVIEWS].filter((r) => (r.product === "*" || r.product === product.slug) && (position === "all" || r.position === position) && (body === "all" || r.body_type === body) && (!withPhotos || r.photo));
    return list.sort((a, b) => (sort === "helpful" ? b.helpful - a.helpful : b.date.localeCompare(a.date)));
  }, [product.slug, position, body, withPhotos, sort, extra]);

  const distribution = [5, 4, 3, 2, 1].map((s) => ({ s, pct: s === 5 ? 86 : s === 4 ? 11 : s === 3 ? 2 : 1 }));

  return (
    <div className="grid gap-12 lg:grid-cols-[300px_1fr] lg:gap-16">
      <div>
        <p className="display text-7xl">{product.rating.toFixed(1)}</p>
        <Stars value={product.rating} size={18} className="mt-3" />
        <p className="mt-2 text-sm text-stone">{product.reviewCount.toLocaleString("en-IN")} verified reviews</p>
        <button onClick={() => setWriting(true)} className="btn btn-outline mt-6 !py-3">
          Write a review
        </button>
        <ul className="mt-6 space-y-2" aria-label="Rating distribution">
          {distribution.map(({ s, pct }) => (
            <li key={s} className="flex items-center gap-3 text-xs text-stone">
              <span className="w-3">{s}</span>
              <span className="h-px flex-1 bg-ink/10">
                <motion.span className="block h-px bg-gold" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1.4, ease: EASE }} />
              </span>
              <span className="w-8 text-right">{pct}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-6">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by sleeping position">
            <span className="eyebrow mr-2 text-stone">Position</span>
            {(["all", ...Object.keys(POSITION_LABELS)] as (Position | "all")[]).map((p) => (
              <button key={p} className="chip !py-1.5" aria-pressed={position === p} onClick={() => setPosition(p)}>
                {p === "all" ? "All" : POSITION_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by body type">
            <span className="eyebrow mr-2 text-stone">Frame</span>
            {(["all", ...Object.keys(BODY_LABELS)] as (Body | "all")[]).map((b) => (
              <button key={b} className="chip !py-1.5" aria-pressed={body === b} onClick={() => setBody(b)}>
                {b === "all" ? "All" : BODY_LABELS[b]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={withPhotos} onChange={(e) => setWithPhotos(e.target.checked)} className="accent-[#c9a96e]" /> With photos only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-stone">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="border-b border-ink/25 bg-transparent py-1 focus:outline-none">
                <option value="helpful">Most helpful</option>
                <option value="recent">Most recent</option>
              </select>
            </label>
          </div>
        </div>

        <ul className="divide-y divide-ink/10" aria-live="polite">
          <AnimatePresence initial={false} mode="popLayout">
            {reviews.map((r: Review) => (
              <motion.li key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: EASE }} className="py-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Stars value={r.rating} size={13} />
                  <p className="text-xs text-stone">{dateFmt.format(new Date(r.date))}</p>
                </div>
                <h4 className="mt-3 text-2xl">{r.title}</h4>
                <p className="mt-2 max-w-2xl leading-relaxed text-ink/80">{r.body}</p>
                {r.reply && (
                  <div className="mt-4 max-w-2xl border-l border-gold pl-5">
                    <p className="eyebrow text-gold-ink">From the atelier</p>
                    <p className="mt-2 text-sm leading-relaxed text-ink/75">{r.reply}</p>
                  </div>
                )}
                {r.photo && (
                  <button onClick={() => setLightbox(r.photo!)} className="relative mt-4 block h-24 w-32 overflow-hidden" aria-label={`Enlarge photo from ${r.name}`}>
                    <Image src={r.photo} alt={`Photo shared by ${r.name}`} fill sizes="128px" className="object-cover transition-transform duration-1000 ease-silk hover:scale-105" />
                  </button>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone">
                  <span className="text-ink">{r.name}</span>
                  {r.verified && (
                    <span className="flex items-center gap-1">
                      <IconCheck size={13} className="text-gold-ink" /> Verified sleeper
                    </span>
                  )}
                  <span>{POSITION_LABELS[r.position]} sleeper</span>
                  <span>{BODY_LABELS[r.body_type]}</span>
                  <button
                    onClick={() => vote(r.id)}
                    disabled={voted.includes(r.id)}
                    aria-pressed={voted.includes(r.id)}
                    className={cn("ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors duration-700", voted.includes(r.id) ? "border-gold bg-gold/15 text-ink" : "border-ink/15 hover:border-gold")}
                  >
                    <IconThumb size={14} /> Helpful · {r.helpful + (voted.includes(r.id) ? 1 : 0)}
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {reviews.length === 0 && <p className="py-12 text-stone">No reviews match these filters yet.</p>}
      </div>

      <WriteReview product={product} open={writing} onClose={() => setWriting(false)} />

      <AnimatePresence>
        {lightbox && (
          <motion.button
            className="fixed inset-0 z-[110] grid cursor-zoom-out place-items-center bg-midnight/85 p-6"
            onClick={() => setLightbox(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close photo"
          >
            <span className="relative block aspect-[4/3] w-full max-w-4xl">
              <Image src={lightbox} alt="" fill sizes="90vw" className="object-contain" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function WriteReview({ product, open, onClose }: { product: Product; open: boolean; onClose: () => void }) {
  const profile = useAccount((s) => s.profile);
  const noteReview = useAccount((s) => s.noteReview);
  const [f, setF] = useState({ rating: 5, title: "", body: "", name: "", email: "", position: "side" as Position, body_type: "average" as Body });
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && profile) setF((x) => ({ ...x, name: x.name || profile.name, email: x.email || profile.email }));
  }, [open, profile]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState("busy");
    setError("");
    try {
      const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, product: product.slug }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      noteReview();
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
      setState("idle");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Review ${product.name}`} className="sm:max-w-xl">
      {state === "done" ? (
        <div className="px-6 pb-10 pt-4" role="status">
          <p className="display text-3xl">Thank you for sharing your nights.</p>
          <p className="mt-3 text-sm text-stone">Your review will appear once our team has read it, usually within a day. We&rsquo;ve added 250 Sleep Society points to your account.</p>
          <button onClick={onClose} className="btn btn-dark mt-8">Close</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5 px-6 pb-8 pt-2">
          <fieldset>
            <legend className="eyebrow text-stone">Your rating</legend>
            <div role="radiogroup" aria-label="Rating" className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} role="radio" aria-checked={f.rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setF({ ...f, rating: n })} className="p-1 text-gold">
                  <IconStar size={26} filled={n <= f.rating} />
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="eyebrow text-stone">Title</span>
            <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={100} className="field" required />
          </label>
          <label className="block">
            <span className="eyebrow text-stone">Your review</span>
            <textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={4} maxLength={2000} className="field resize-none" required placeholder="How do you feel in the morning? What surprised you?" />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span className="eyebrow text-stone">How you sleep</span>
              <select value={f.position} onChange={(e) => setF({ ...f, position: e.target.value as Position })} className="field">
                {Object.entries(POSITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="eyebrow text-stone">Your frame</span>
              <select value={f.body_type} onChange={(e) => setF({ ...f, body_type: e.target.value as Body })} className="field">
                {Object.entries(BODY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="eyebrow text-stone">Name to show</span>
              <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={40} className="field" required autoComplete="name" />
            </label>
            <label>
              <span className="eyebrow text-stone">Email (never shown)</span>
              <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="field" required autoComplete="email" />
            </label>
          </div>
          {error && <p className="text-sm text-[#9a5a4a]" role="alert">{error}</p>}
          <button type="submit" disabled={state === "busy"} className="btn btn-dark w-full">
            {state === "busy" ? "Sending…" : "Submit review"}
          </button>
        </form>
      )}
    </Dialog>
  );
}
