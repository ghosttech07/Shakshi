"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Img } from "@/components/ui/Img";
import { FirmnessScale, Stars } from "@/components/ui/Bits";
import { SizePicker } from "./SizePicker";
import { useStore } from "@/lib/store";
import { priceFor, type SizeId } from "@shakshi/shared/products";
import { useCatalog } from "@/lib/catalog-context";
import { mattressItem } from "@/lib/cart-helpers";
import { emiFrom, formatINR } from "@shakshi/shared/utils";
import { IconArrow } from "@/components/ui/Icons";

export function QuickView() {
  const slug = useStore((s) => s.quickView);
  const setQuickView = useStore((s) => s.setQuickView);
  const addToCart = useStore((s) => s.addToCart);
  const catalog = useCatalog();
  const product = slug ? catalog.get(slug) : undefined;
  const [size, setSize] = useState<SizeId>("queen");
  useEffect(() => setSize("queen"), [slug]);
  const close = () => setQuickView(null);

  return (
    <Dialog open={!!product} onClose={close} title={product?.name ?? "Quick view"} hideTitle className="sm:max-w-4xl">
      {product && (
        <div className="grid sm:grid-cols-2">
          <Img src={product.images[0]} alt={`${product.name} in a bedroom`} sizes="(min-width: 640px) 450px, 100vw" wrapperClassName="aspect-[4/5] sm:aspect-auto sm:min-h-[560px]" />
          <div className="flex flex-col p-6 sm:p-10">
            <p className="eyebrow text-gold-ink">{product.tier}</p>
            <p className="display mt-3 text-4xl" aria-hidden>{product.name}</p>
            <p className="mt-3 text-stone">{product.tagline}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-stone">
              <Stars value={product.rating} size={12} /> {product.reviewCount.toLocaleString("en-IN")} reviews
            </div>
            <div className="mt-7">
              <p className="eyebrow mb-3 text-stone">{product.firmnessLabel}</p>
              <FirmnessScale value={product.firmness} />
            </div>
            <div className="mt-7">
              <SizePicker product={product} value={size} onChange={setSize} dense />
            </div>
            <div className="mt-7 flex items-baseline justify-between">
              <p className="font-serif text-3xl">{formatINR(priceFor(product, size))}</p>
              <p className="text-xs text-stone">or {formatINR(emiFrom(priceFor(product, size)))}/mo · no-cost EMI</p>
            </div>
            <button
              className="btn btn-gold mt-6"
              onClick={() => {
                addToCart(mattressItem(product, size));
                close();
              }}
            >
              Add to bag
            </button>
            <Link href={`/mattress/${product.slug}`} onClick={close} className="mt-5 inline-flex items-center gap-2 self-center text-xs uppercase tracking-[0.25em] text-stone hover:text-ink">
              Full details <IconArrow size={16} />
            </Link>
          </div>
        </div>
      )}
    </Dialog>
  );
}
