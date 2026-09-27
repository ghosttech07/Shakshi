"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { SIZES, MATERIAL_LABELS, POSITION_LABELS, priceFor, type Material, type Position, type SizeId } from "@shakshi/shared/products";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Dialog } from "@/components/ui/Dialog";
import { EASE, cn, formatINR } from "@shakshi/shared/utils";
import { CompareBar } from "./Compare";
import { useCatalog } from "@/lib/catalog-context";
import { useSite } from "@/lib/site-context";
import Link from "next/link";

type Firm = "plush" | "medium" | "firm";
const FIRM: { id: Firm; label: string; test: (f: number) => boolean }[] = [
  { id: "plush", label: "Plush", test: (f) => f <= 4 },
  { id: "medium", label: "Medium", test: (f) => f >= 5 && f <= 6 },
  { id: "firm", label: "Firm", test: (f) => f >= 7 },
];
const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price, low to high" },
  { id: "price-desc", label: "Price, high to low" },
  { id: "soft", label: "Softest first" },
  { id: "firm", label: "Firmest first" },
] as const;

type Filters = { firm: Firm[]; size: SizeId; materials: Material[]; positions: Position[]; max: number };

const PRICE_CEILING = 230000;
const initial: Filters = { firm: [], size: "queen", materials: [], positions: [], max: PRICE_CEILING };

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-ink/10 py-6">
      <legend className="eyebrow float-left mb-4 w-full text-stone">{title}</legend>
      <div className="clear-both flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function FilterPanel({ f, set }: { f: Filters; set: (f: Filters) => void }) {
  return (
    <div>
      <FilterGroup title="Firmness">
        {FIRM.map((x) => (
          <button key={x.id} type="button" className="chip" aria-pressed={f.firm.includes(x.id)} onClick={() => set({ ...f, firm: toggle(f.firm, x.id) })}>
            {x.label}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup title="Size">
        {SIZES.map((s) => (
          <button key={s.id} type="button" className="chip" aria-pressed={f.size === s.id} onClick={() => set({ ...f, size: s.id })}>
            {s.label}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup title="Sleeping position">
        {(Object.keys(POSITION_LABELS) as Position[]).map((p) => (
          <button key={p} type="button" className="chip" aria-pressed={f.positions.includes(p)} onClick={() => set({ ...f, positions: toggle(f.positions, p) })}>
            {POSITION_LABELS[p]}
          </button>
        ))}
      </FilterGroup>
      <FilterGroup title="Material">
        {(Object.keys(MATERIAL_LABELS) as Material[]).map((m) => (
          <button key={m} type="button" className="chip" aria-pressed={f.materials.includes(m)} onClick={() => set({ ...f, materials: toggle(f.materials, m) })}>
            {MATERIAL_LABELS[m]}
          </button>
        ))}
      </FilterGroup>
      <fieldset className="border-t border-ink/10 py-6">
        <legend className="eyebrow float-left mb-4 w-full text-stone">Price</legend>
        <label htmlFor="price-max" className="clear-both flex items-baseline justify-between text-sm">
          <span>Up to</span>
          <span className="font-serif text-xl">{f.max >= PRICE_CEILING ? "Any" : formatINR(f.max)}</span>
        </label>
        <input
          id="price-max"
          type="range"
          min={40000}
          max={PRICE_CEILING}
          step={5000}
          value={f.max}
          onChange={(e) => set({ ...f, max: +e.target.value })}
          className="mt-2 w-full text-ink"
          aria-valuetext={f.max >= PRICE_CEILING ? "Any price" : formatINR(f.max)}
        />
      </fieldset>
    </div>
  );
}

/** Tabs across the top of the shop: all products, then each category. */
function CategoryTabs({ current }: { current?: string }) {
  const categories = useSite().categories.filter((c) => c.slug && c.name);
  if (!categories.length) return null;
  const tab = (href: string, label: string, on: boolean) => (
    <Link
      key={href}
      href={href}
      aria-current={on ? "page" : undefined}
      className={cn("whitespace-nowrap border-b pb-2 text-sm transition-colors duration-500", on ? "border-gold text-ink" : "border-transparent text-stone hover:text-ink")}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Product categories" className="-mx-5 mb-8 overflow-x-auto px-5 md:mx-0 md:px-0">
      <div className="flex gap-8">
        {tab("/shop", "All products", !current)}
        {categories.map((c) => tab(`/shop/${c.slug}`, c.name, current === c.slug))}
      </div>
    </nav>
  );
}

export function ShopClient({ category }: { category?: string } = {}) {
  const [f, setF] = useState<Filters>(initial);
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("featured");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { products: PRODUCTS } = useCatalog();
  const results = useMemo(() => {
    const list = PRODUCTS.filter(
      (p) =>
        (!category || p.category === category) &&
        (!f.firm.length || f.firm.some((id) => FIRM.find((x) => x.id === id)!.test(p.firmness))) &&
        (!f.materials.length || f.materials.every((m) => p.materials.includes(m))) &&
        (!f.positions.length || f.positions.some((pos) => p.positions.includes(pos))) &&
        priceFor(p, f.size) <= f.max
    );
    const by = {
      featured: () => 0,
      "price-asc": (a: (typeof list)[0], b: (typeof list)[0]) => a.basePrice - b.basePrice,
      "price-desc": (a: (typeof list)[0], b: (typeof list)[0]) => b.basePrice - a.basePrice,
      soft: (a: (typeof list)[0], b: (typeof list)[0]) => a.firmness - b.firmness,
      firm: (a: (typeof list)[0], b: (typeof list)[0]) => b.firmness - a.firmness,
    }[sort];
    return [...list].sort(by);
  }, [f, sort, PRODUCTS, category]);

  const activeCount = f.firm.length + f.materials.length + f.positions.length + (f.max < PRICE_CEILING ? 1 : 0);

  return (
    <div className="container-lux pb-32">
      <CategoryTabs current={category} />
      <div className="sticky top-16 z-20 -mx-5 flex items-center justify-between gap-4 border-b border-ink/10 bg-ivory/90 px-5 py-4 backdrop-blur md:-mx-10 md:px-10 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        <button className="chip lg:hidden" onClick={() => setMobileOpen(true)} aria-haspopup="dialog">
          Refine{activeCount > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-gold text-[0.65rem] text-midnight">{activeCount}</span>}
        </button>
        <p className="hidden text-sm text-stone lg:block" aria-live="polite">
          {results.length} {results.length === 1 ? "mattress" : "mattresses"}
        </p>
        <label className="flex items-center gap-3 text-sm">
          <span className="hidden text-stone sm:inline">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="border-b border-ink/25 bg-transparent py-1.5 pr-6 focus:border-gold focus:outline-none">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-12 lg:grid-cols-[280px_1fr] lg:gap-16">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-28">
            <FilterPanel f={f} set={setF} />
            {activeCount > 0 && (
              <button onClick={() => setF({ ...initial, size: f.size })} className="text-xs uppercase tracking-[0.2em] text-stone underline-offset-4 hover:text-ink hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        <div>
          <motion.ul layout className="grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {results.map((p, i) => (
                <motion.li key={p.slug} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.8, ease: EASE }}>
                  <ProductCard product={p} index={i} showCompare size={f.size} priority={i < 3} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
          {results.length === 0 && (
            <div className="py-24 text-center">
              <p className="font-serif text-3xl">Nothing quite matches, yet.</p>
              <p className="mt-3 text-stone">Loosen a filter or two, or book a free call and a specialist will guide you.</p>
              <button onClick={() => setF(initial)} className="btn btn-outline mt-8">
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={mobileOpen} onClose={() => setMobileOpen(false)} title="Refine" variant="bottom">
        <div className="px-6 pb-4">
          <FilterPanel f={f} set={setF} />
        </div>
        <div className="sticky bottom-0 flex gap-3 border-t border-ink/10 bg-ivory p-4">
          <button className="btn btn-outline flex-1" onClick={() => setF({ ...initial, size: f.size })}>
            Clear
          </button>
          <button className={cn("btn btn-dark flex-1")} onClick={() => setMobileOpen(false)}>
            Show {results.length}
          </button>
        </div>
      </Dialog>

      <CompareBar size={f.size} />
    </div>
  );
}
