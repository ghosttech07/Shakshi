"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { useAccount } from "@/lib/account";
import { useHydrated } from "@/lib/useHydrated";
import { useCatalog } from "@/lib/catalog-context";
import { recommend } from "@/lib/recommend";
import { ProductCard } from "./ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/** "Recommended for you": appears only once we know something about the visitor. */
export function RecommendedRow({ exclude, title = "Recommended for you", className }: { exclude?: string[]; title?: string; className?: string }) {
  const hydrated = useHydrated();
  const { products } = useCatalog();
  const recent = useStore((s) => s.recent);
  const wishlist = useStore((s) => s.wishlist);
  const quiz = useAccount((s) => s.quiz);
  const recs = useMemo(() => (hydrated ? recommend(products, { quiz, recent, wishlist, exclude }) : []), [hydrated, products, quiz, recent, wishlist, exclude]);

  if (!recs.length) return null;
  return (
    <section className={cn("container-lux py-20 lg:py-28", className)} aria-labelledby="recs-title">
      <Reveal>
        <p className="eyebrow text-gold-ink">Chosen with you in mind</p>
        <h2 id="recs-title" className="display mt-4 text-4xl lg:text-5xl">
          {title}
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {recs.map((r, i) => (
          <div key={r.product.slug}>
            <p className="mb-3 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-ink">
              <span className="h-1 w-1 rounded-full bg-gold" aria-hidden /> {r.reason}
            </p>
            <ProductCard product={r.product} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
