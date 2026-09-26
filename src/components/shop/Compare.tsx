"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useCatalog } from "@/lib/catalog-context";
import { useHydrated } from "@/lib/useHydrated";
import { priceFor, MATERIAL_LABELS, POSITION_LABELS, SIZES, type Product, type SizeId } from "@/lib/products";
import { mattressItem } from "@/lib/cart-helpers";
import { Dialog } from "@/components/ui/Dialog";
import { Img } from "@/components/ui/Img";
import { FirmnessScale, Stars } from "@/components/ui/Bits";
import { EASE, formatINR } from "@/lib/utils";
import { IconClose, IconCompare } from "@/components/ui/Icons";

function Dots({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`${label}: ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-1.5 w-5 rounded-full ${i <= value ? "bg-gold" : "bg-ink/10"}`} />
      ))}
    </span>
  );
}

const ROWS: { label: string; render: (p: Product, size: SizeId) => React.ReactNode }[] = [
  { label: "Price", render: (p, s) => <span className="font-serif text-2xl">{formatINR(priceFor(p, s))}</span> },
  { label: "Firmness", render: (p) => <div className="max-w-[220px]"><FirmnessScale value={p.firmness} /></div> },
  { label: "The feeling", render: (p) => <span className="font-serif text-xl italic">{p.feeling}</span> },
  { label: "Height", render: (p) => `${p.height} cm` },
  { label: "Best for", render: (p) => p.positions.map((x) => POSITION_LABELS[x]).join(", ") + " sleepers" },
  { label: "Materials", render: (p) => p.materials.map((m) => MATERIAL_LABELS[m]).join(" · ") },
  { label: "Cooling", render: (p) => <Dots value={p.cooling} label="Cooling" /> },
  { label: "Motion isolation", render: (p) => <Dots value={p.motionIsolation} label="Motion isolation" /> },
  { label: "Edge support", render: (p) => <Dots value={p.edgeSupport} label="Edge support" /> },
  { label: "Rating", render: (p) => <span className="flex items-center gap-2"><Stars value={p.rating} size={12} /> {p.rating.toFixed(1)}</span> },
  { label: "Trial & warranty", render: () => "100 nights · 10 years" },
];

export function CompareBar({ size }: { size: SizeId }) {
  const hydrated = useHydrated();
  const compare = useStore((s) => s.compare);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const clearCompare = useStore((s) => s.clearCompare);
  const addToCart = useStore((s) => s.addToCart);
  const [open, setOpen] = useState(false);
  const { get } = useCatalog();
  const items = hydrated ? compare.map((s) => get(s)).filter((p): p is Product => !!p) : [];
  const sizeLabel = SIZES.find((s) => s.id === size)!.label;

  return (
    <>
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            className="glass-dark fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-2xl items-center gap-4 rounded-full p-2 pl-5 text-pearl shadow-lift sm:bottom-8"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            role="region"
            aria-label="Comparison tray"
          >
            <IconCompare size={20} className="hidden shrink-0 text-gold sm:block" />
            <ul className="flex flex-1 gap-2 overflow-hidden">
              {items.map((p) => (
                <li key={p.slug} className="flex min-w-0 items-center gap-1.5 rounded-full bg-pearl/10 py-1 pl-3 pr-1 text-xs">
                  <span className="truncate">{p.name.replace("The ", "")}</span>
                  <button onClick={() => toggleCompare(p.slug)} aria-label={`Remove ${p.name} from comparison`} className="grid h-6 w-6 shrink-0 place-items-center rounded-full hover:bg-pearl/15">
                    <IconClose size={12} />
                  </button>
                </li>
              ))}
            </ul>
            <button className="btn btn-gold shrink-0 rounded-full !px-5 !py-3" onClick={() => setOpen(true)} disabled={items.length < 2}>
              Compare {items.length}/3
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={open && items.length > 0} onClose={() => setOpen(false)} title={`Side by side · ${sizeLabel}`} variant="bottom">
        <div className="overflow-x-auto px-6 pb-10 pt-4" data-lenis-prevent>
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <caption className="sr-only">Comparison of selected mattresses in {sizeLabel} size</caption>
            <thead>
              <tr>
                <th scope="col" className="w-40" />
                {items.map((p) => (
                  <th key={p.slug} scope="col" className="px-4 pb-6 align-top font-normal">
                    <Img src={p.images[0]} alt="" sizes="220px" wrapperClassName="aspect-[4/3] w-full max-w-[240px]" />
                    <Link href={`/mattress/${p.slug}`} onClick={() => setOpen(false)} className="link-lux mt-4 inline-block font-serif text-2xl">
                      {p.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label} className="border-t border-ink/10">
                  <th scope="row" className="eyebrow py-4 pr-4 align-middle font-sans text-stone">
                    {r.label}
                  </th>
                  {items.map((p) => (
                    <td key={p.slug} className="px-4 py-4 align-middle">
                      {r.render(p, size)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-ink/10">
                <td />
                {items.map((p) => (
                  <td key={p.slug} className="px-4 pt-6">
                    <button
                      className="btn btn-dark w-full max-w-[240px]"
                      onClick={() => {
                        setOpen(false);
                        addToCart(mattressItem(p, size));
                      }}
                    >
                      Add {sizeLabel}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <button onClick={() => { clearCompare(); setOpen(false); }} className="mt-8 text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">
            Clear comparison
          </button>
        </div>
      </Dialog>
    </>
  );
}
