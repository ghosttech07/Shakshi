"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useCatalog } from "@/lib/catalog-context";
import { recommend } from "@/lib/recommend";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@shakshi/shared/utils";
import { fieldFn } from "@/components/cms/text";

/**
 * "Recommended for you": appears only once we know something about the visitor.
 * With `fallbackTitle`, shows a plain selection under that title when there are no signals yet.
 */
export function RecommendedRow({ exclude, title = "Recommended for you", fallbackTitle, className, edit }: { exclude?: string[]; title?: string; fallbackTitle?: string; className?: string; edit?: boolean }) {
  const f = fieldFn(edit);
  const hydrated = useHydrated();
  const { products } = useCatalog();
  const recent = useStore((s) => s.recent);
  const wishlist = useStore((s) => s.wishlist);
  const recs = useMemo(() => (hydrated ? recommend(products, { recent, wishlist, exclude }) : []), [hydrated, products, recent, wishlist, exclude]);

  const fallback = !recs.length && fallbackTitle ? products.filter((p) => !exclude?.includes(p.slug)).slice(0, 3) : [];
  if (!recs.length && !fallback.length) return null;
  const items = recs.length ? recs : fallback.map((product) => ({ product, reason: "", score: 0 }));
  return (
    <section className={cn("container-lux py-20 lg:py-28", className)} aria-labelledby="recs-title">
      <Reveal>
        <p className="eyebrow text-gold-ink">{recs.length ? "Chosen with you in mind" : "The collection"}</p>
        <h2 id="recs-title" className="display mt-4 text-4xl lg:text-5xl" {...f(recs.length ? "title" : "fallbackTitle")}>
          {recs.length ? title : fallbackTitle}
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r, i) => (
          <div key={r.product.slug}>
            {r.reason && (
              <p className="mb-3 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-ink">
                <span className="h-1 w-1 rounded-full bg-gold" aria-hidden /> {r.reason}
              </p>
            )}
            <ProductCard product={r.product} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
