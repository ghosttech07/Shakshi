"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type PointerEvent } from "react";
import type { Product } from "@/lib/products";
import { EASE, cn } from "@/lib/utils";
import { IconRotate, IconZoom } from "@/components/ui/Icons";
import { ARPreview } from "./ARPreview";
import type { SizeId } from "@/lib/products";

const MattressViewer = dynamic(() => import("@/components/three/MattressViewer"), {
  ssr: false,
  loading: () => (
    <div className="skeleton grid h-full w-full place-items-center">
      <p className="eyebrow text-stone">Preparing the 3D view…</p>
    </div>
  ),
});

export function Gallery({ product, size }: { product: Product; size: SizeId }) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"photo" | "3d">("photo");
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [explode, setExplode] = useState(false);
  const [spin, setSpin] = useState(true);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="lg:sticky lg:top-24">
      <div className="relative aspect-[4/5] overflow-hidden bg-ivory-2 sm:aspect-[5/4] lg:aspect-[4/4.2]">
        <AnimatePresence mode="wait" initial={false}>
          {mode === "photo" ? (
            <motion.div
              key={`p-${index}`}
              className="absolute inset-0 cursor-zoom-in"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
              onPointerMove={onMove}
              onPointerLeave={() => setZoom(null)}
            >
              <Image
                src={product.images[index]}
                alt={`${product.name}, view ${index + 1} of ${product.images.length}`}
                fill
                preload={index === 0}
                loading={index === 0 ? "eager" : undefined}
                quality={85}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover transition-transform duration-500 ease-out"
                style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
              <span className="glass pointer-events-none absolute bottom-4 left-4 hidden items-center gap-2 rounded-full px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-ink lg:inline-flex">
                <IconZoom size={14} /> Hover to look closer
              </span>
            </motion.div>
          ) : (
            <motion.div key="3d" className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_40%,#fbf6ee,#e9dfcf)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: EASE }}>
              <MattressViewer layers={product.layers} explode={explode ? 1 : 0} autoRotate={spin} />
              <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2">
                <p className="glass rounded-full px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-ink">Drag to turn · pinch to approach</p>
                <div className="flex gap-2">
                  <button onClick={() => setSpin(!spin)} aria-pressed={spin} className="glass rounded-full px-4 py-2 text-xs text-ink">
                    {spin ? "Pause" : "Spin"}
                  </button>
                  <button onClick={() => setExplode(!explode)} aria-pressed={explode} className={cn("rounded-full px-4 py-2 text-xs transition-colors duration-700", explode ? "bg-midnight text-pearl" : "glass text-ink")}>
                    {explode ? "Assemble" : "Reveal layers"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <ul className="no-scrollbar flex flex-1 gap-3 overflow-x-auto" aria-label="Product images">
          {product.images.map((src, i) => (
            <li key={src} className="shrink-0">
              <button
                onClick={() => {
                  setMode("photo");
                  setIndex(i);
                }}
                aria-label={`Show image ${i + 1}`}
                aria-current={mode === "photo" && index === i}
                className={cn("relative block h-16 w-16 overflow-hidden transition-opacity duration-700 sm:h-20 sm:w-20", mode === "photo" && index === i ? "opacity-100 ring-1 ring-gold ring-offset-2 ring-offset-ivory" : "opacity-60 hover:opacity-100")}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
          <li className="shrink-0">
            <button
              onClick={() => setMode("3d")}
              aria-current={mode === "3d"}
              className={cn(
                "flex h-16 w-16 flex-col items-center justify-center gap-1 border text-[0.6rem] uppercase tracking-[0.15em] transition-colors duration-700 sm:h-20 sm:w-20",
                mode === "3d" ? "border-gold bg-midnight text-pearl" : "border-ink/15 hover:border-gold"
              )}
            >
              <IconRotate size={22} className="text-gold" />
              360°
            </button>
          </li>
        </ul>
        <ARPreview product={product} size={size} />
      </div>
    </div>
  );
}
