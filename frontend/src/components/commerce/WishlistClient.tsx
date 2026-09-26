"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import type { Product } from "@shakshi/shared/products";
import { useCatalog } from "@/lib/catalog-context";
import { ProductCard } from "./ProductCard";
import { IconHeart } from "@/components/ui/Icons";
import { Img } from "@/components/ui/Img";
import { formatINR } from "@shakshi/shared/utils";

export function WishlistClient() {
  const hydrated = useHydrated();
  const wishlist = useStore((s) => s.wishlist);
  const recent = useStore((s) => s.recent);
  const { get } = useCatalog();
  const saved = hydrated ? wishlist.map((s) => get(s)).filter((p): p is Product => !!p) : [];
  const viewed = hydrated ? recent.map((s) => get(s)).filter((p): p is Product => !!p) : [];

  return (
    <div className="container-lux pb-28 pt-36 lg:pt-44">
      <p className="eyebrow text-gold-ink">Saved for later</p>
      <h1 className="display mt-5 text-5xl sm:text-6xl lg:text-7xl">Your wishlist</h1>
      <p className="mt-4 text-sm text-stone">Kept privately on this device.</p>
      <div className="gold-rule mt-12" />

      {!hydrated ? (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton aspect-[4/5]" />
          ))}
        </div>
      ) : saved.length ? (
        <div className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
          {saved.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <IconHeart size={40} className="mx-auto text-gold-ink" />
          <p className="mt-6 font-serif text-3xl">Nothing saved just yet.</p>
          <p className="mt-3 text-stone">Tap the heart on any mattress to keep it close.</p>
          <Link href="/shop" className="btn btn-dark mt-8">
            Explore mattresses
          </Link>
        </div>
      )}

      {viewed.length > 0 && (
        <section className="mt-24" aria-labelledby="recent-title">
          <h2 id="recent-title" className="eyebrow text-stone">Recently viewed</h2>
          <ul className="no-scrollbar mt-6 flex gap-4 overflow-x-auto">
            {viewed.map((p) => (
              <li key={p.slug} className="w-60 shrink-0">
                <Link href={`/mattress/${p.slug}`} className="group block">
                  <Img src={p.images[0]} alt="" sizes="240px" wrapperClassName="aspect-[4/3]" className="transition-transform duration-1000 ease-silk group-hover:scale-105" />
                  <p className="mt-3 font-serif text-xl">{p.name}</p>
                  <p className="text-xs text-stone">from {formatINR(p.basePrice)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
