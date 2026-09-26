"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLoad3D } from "@/lib/use3d";
import { track } from "@/lib/analytics";
import { Img } from "@/components/ui/Img";
import { SIZES, COVERS, FRAMES, PILLOW_OPTIONS, priceFor, type SizeId } from "@shakshi/shared/products";
import { IMG } from "@shakshi/shared/images";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/catalog-context";
import { EASE, cn, emiFrom, formatINR } from "@shakshi/shared/utils";
import { IconCheck } from "@/components/ui/Icons";

const BedScene = dynamic(() => import("@/components/three/BedScene"), {
  ssr: false,
  loading: () => (
    <div className="skeleton grid h-full w-full place-items-center">
      <p className="eyebrow text-stone">Preparing your bed…</p>
    </div>
  ),
});

function Step({ n, title, value, children }: { n: number; title: string; value: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-ink/10 py-7">
      <legend className="flex w-full items-baseline justify-between gap-4">
        <span className="flex items-baseline gap-3">
          <span className="font-serif text-lg text-gold-ink">0{n}</span>
          <span className="font-serif text-2xl">{title}</span>
        </span>
        <span className="text-sm text-stone">{value}</span>
      </legend>
      <div className="mt-5">{children}</div>
    </fieldset>
  );
}

export function Configurator() {
  const stage = useRef<HTMLDivElement>(null);
  const [force3D, setForce3D] = useState(false);
  const { go, policy } = useLoad3D(stage);
  const [slug, setSlug] = useState("signature");
  const [size, setSize] = useState<SizeId>("king");
  const [cover, setCover] = useState(COVERS[0].id);
  const [pillows, setPillows] = useState(2);
  const [frameId, setFrameId] = useState("aurelia");
  const [added, setAdded] = useState(false);
  const addToCart = useStore((s) => s.addToCart);

  // Count the configurator as used (once per visit) when the visitor first changes anything.
  const initial = useRef(true);
  const tracked = useRef(false);
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    if (tracked.current) return;
    tracked.current = true;
    track("configurator_use", { mattress: slug, size, cover, frame: frameId, pillows });
  }, [slug, size, cover, frameId, pillows]);

  // On small screens the price bar is pinned to the bottom; lift the concierge above it.
  useEffect(() => {
    document.documentElement.setAttribute("data-dock", "mobile");
    return () => document.documentElement.removeAttribute("data-dock");
  }, []);

  const { products: PRODUCTS } = useCatalog();
  const product = PRODUCTS.find((p) => p.slug === slug) ?? PRODUCTS[0];
  const s = SIZES.find((x) => x.id === size)!;
  const c = COVERS.find((x) => x.id === cover)!;
  const frame = FRAMES.find((f) => f.id === frameId)!;
  const pillowOpt = PILLOW_OPTIONS.find((p) => p.id === pillows)!;
  const frameCost = Math.round((frame.price * s.factor) / 100) * 100;
  const mattressCost = priceFor(product, size);
  const total = mattressCost + frameCost + pillowOpt.price;

  const add = () => {
    addToCart({ key: `${slug}-${size}-${cover}`, kind: "mattress", ref: slug, name: product.name, detail: `${s.label} · ${c.name} cover · ${product.firmnessLabel}`, image: product.images[0], size, price: mattressCost });
    if (frame.price) addToCart({ key: `frame-${frame.id}-${size}`, kind: "bundle", ref: frame.id, name: `${frame.name} Frame`, detail: `${s.label} · ${frame.note}`, image: IMG.platform, price: frameCost }, false);
    if (pillowOpt.price) addToCart({ key: `pillows-${pillows}`, kind: "accessory", ref: "pillows", name: pillowOpt.name, detail: "Adjustable loft, hotel-grade", image: IMG.pillowWhite, price: pillowOpt.price }, false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const lines = [
    { label: `${product.name}, ${s.label}`, value: mattressCost },
    { label: `${c.name} cover`, value: 0 },
    { label: pillowOpt.name, value: pillowOpt.price, hide: !pillowOpt.price },
    { label: frame.price ? `${frame.name} frame` : "No frame", value: frameCost, hide: !frame.price },
  ].filter((l) => !l.hide);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
      <div className="lg:sticky lg:top-24 lg:h-[calc(100svh-8rem)]">
        <div ref={stage} className="stage-light relative h-[52svh] min-h-[340px] overflow-hidden bg-[radial-gradient(90%_80%_at_50%_30%,#fbf6ee,#e7dccb)] lg:h-full">
          {go || force3D ? (
            <BedScene layers={product.layers} cover={c.hex} widthCm={s.cm[0]} depthCm={s.cm[1]} frame={frame} pillows={pillows} />
          ) : policy === "never" ? (
            // Slow connection or modest device: a still room, and the 3D preview only on request.
            <div className="absolute inset-0">
              <Img src={product.images[0]} alt={`${product.name} in a bedroom`} sizes="(min-width: 1024px) 55vw, 100vw" wrapperClassName="absolute inset-0" />
              <div className="absolute inset-0 grid place-items-center bg-midnight/25">
                <button onClick={() => setForce3D(true)} className="btn btn-gold">
                  Load the 3D preview
                </button>
              </div>
            </div>
          ) : (
            <div className="skeleton grid h-full w-full place-items-center">
              <p className="eyebrow text-stone">Preparing your bed…</p>
            </div>
          )}
          <div className="glass pointer-events-none absolute left-4 top-4 rounded-full px-4 py-2 text-[0.65rem] uppercase tracking-[0.2em] text-ink">Drag to look around</div>
          <AnimatePresence mode="wait">
            <motion.div key={`${slug}${size}${cover}${frameId}`} className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.7, ease: EASE }}>
              {[product.name, s.label, `${c.name} cover`, frame.name].map((t) => (
                <span key={t} className="glass rounded-full px-3 py-1.5 text-xs text-ink">{t}</span>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div>
        <Step n={1} title="Mattress" value={product.firmnessLabel}>
          <div role="radiogroup" aria-label="Mattress" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {PRODUCTS.map((p) => (
              <button key={p.slug} role="radio" aria-checked={slug === p.slug} onClick={() => setSlug(p.slug)} className={cn("border p-3 text-left transition-all duration-700 ease-silk", slug === p.slug ? "border-midnight bg-midnight text-pearl" : "border-ink/15 hover:border-gold")}>
                <span className="block font-serif text-lg leading-tight">{p.name.replace("The ", "")}</span>
                <span className={cn("block text-[0.7rem]", slug === p.slug ? "text-gold" : "text-stone")}>{p.firmnessLabel}</span>
              </button>
            ))}
          </div>
        </Step>

        <Step n={2} title="Size" value={s.dims}>
          <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
            {SIZES.map((x) => (
              <button key={x.id} role="radio" aria-checked={size === x.id} className="chip" onClick={() => setSize(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
        </Step>

        <Step n={3} title="Cover" value={`${c.name} · complimentary`}>
          <div role="radiogroup" aria-label="Cover colour" className="flex flex-wrap gap-4">
            {COVERS.map((x) => (
              <button key={x.id} role="radio" aria-checked={cover === x.id} aria-label={x.name} onClick={() => setCover(x.id)} className="group flex flex-col items-center gap-2">
                <span className={cn("grid h-12 w-12 place-items-center rounded-full border shadow-inner transition-all duration-700 ease-silk", cover === x.id ? "scale-110 border-gold ring-1 ring-gold ring-offset-4 ring-offset-ivory" : "border-ink/15 group-hover:scale-105")} style={{ background: `radial-gradient(circle at 35% 30%, #ffffff55, transparent 60%), ${x.hex}` }}>
                  {cover === x.id && <IconCheck size={16} className={x.id === "midnight" ? "text-pearl" : "text-ink"} />}
                </span>
                <span className="text-xs text-stone">{x.name}</span>
              </button>
            ))}
          </div>
        </Step>

        <Step n={4} title="Pillows" value={pillowOpt.price ? formatINR(pillowOpt.price) : "None"}>
          <div role="radiogroup" aria-label="Pillows" className="flex flex-wrap gap-2">
            {PILLOW_OPTIONS.map((p) => (
              <button key={p.id} role="radio" aria-checked={pillows === p.id} className="chip" onClick={() => setPillows(p.id)}>
                {p.name}
              </button>
            ))}
          </div>
        </Step>

        <Step n={5} title="Frame" value={frame.price ? formatINR(frameCost) : "—"}>
          <div role="radiogroup" aria-label="Bed frame" className="grid gap-2 sm:grid-cols-2">
            {FRAMES.map((f) => (
              <button key={f.id} role="radio" aria-checked={frameId === f.id} onClick={() => setFrameId(f.id)} className={cn("flex items-center gap-3 border p-4 text-left transition-all duration-700 ease-silk", frameId === f.id ? "border-midnight bg-midnight text-pearl" : "border-ink/15 hover:border-gold")}>
                <span className="h-8 w-8 shrink-0 rounded-full border border-pearl/20" style={{ background: f.id === "none" ? "transparent" : `linear-gradient(135deg, ${f.fabric}, ${f.wood})` }} />
                <span>
                  <span className="block font-serif text-lg leading-tight">{f.name}</span>
                  <span className={cn("block text-[0.7rem]", frameId === f.id ? "text-pearl/60" : "text-stone")}>{f.note}</span>
                </span>
              </button>
            ))}
          </div>
        </Step>

        <div className="sticky bottom-0 z-10 -mx-5 border-t border-ink/10 bg-ivory/95 px-5 py-6 backdrop-blur sm:mx-0 sm:px-0 lg:static lg:bg-transparent lg:backdrop-blur-none">
          <dl className="hidden space-y-1.5 text-sm sm:block">
            {lines.map((l) => (
              <div key={l.label} className="flex justify-between gap-4">
                <dt className="text-stone">{l.label}</dt>
                <dd>{l.value ? formatINR(l.value) : "Included"}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-end justify-between gap-4 sm:mt-5 sm:border-t sm:border-ink/10 sm:pt-5">
            <div>
              <p className="eyebrow text-stone">Your bed</p>
              <motion.p key={total} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="font-serif text-4xl" aria-live="polite">
                {formatINR(total)}
              </motion.p>
              <p className="text-xs text-stone">or {formatINR(emiFrom(total))}/mo, no-cost EMI</p>
            </div>
            <button className="btn btn-gold" onClick={add}>
              {added ? (
                <>
                  <IconCheck size={16} /> Added
                </>
              ) : (
                "Add to bag"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
