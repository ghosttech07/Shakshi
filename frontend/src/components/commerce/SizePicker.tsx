"use client";

import { SIZES, priceFor, type Product, type SizeId } from "@shakshi/shared/products";
import { cn, formatINR } from "@shakshi/shared/utils";
import { useCatalog } from "@/lib/catalog-context";

export function SizePicker({ product, value, onChange, dense }: { product: Product; value: SizeId; onChange: (s: SizeId) => void; dense?: boolean }) {
  const { stockFor } = useCatalog();
  return (
    <fieldset>
      <legend className="eyebrow text-stone">Size</legend>
      <div role="radiogroup" aria-label="Mattress size" className={cn("mt-3 grid gap-2", dense ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-3")}>
        {SIZES.map((s) => {
          const active = s.id === value;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(s.id)}
              onKeyDown={(e) => {
                const i = SIZES.findIndex((x) => x.id === value);
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  onChange(SIZES[(i + 1) % SIZES.length].id);
                }
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  onChange(SIZES[(i - 1 + SIZES.length) % SIZES.length].id);
                }
              }}
              tabIndex={active ? 0 : -1}
              className={cn(
                "flex flex-col items-start border px-3.5 py-3 text-left transition-all duration-700 ease-silk",
                active ? "border-midnight bg-midnight text-pearl" : "border-ink/15 hover:border-gold"
              )}
            >
              <span className="text-sm">{s.label}</span>
              {!dense && <span className={cn("mt-0.5 text-[0.7rem]", active ? "text-pearl/60" : "text-stone")}>{s.dims}</span>}
              {!dense && <span className={cn("mt-1.5 text-xs", active ? "text-gold" : "text-ink/80")}>{formatINR(priceFor(product, s.id))}</span>}
              {(() => {
                const left = stockFor(product.slug, s.id);
                if (left === null || left > 5) return null;
                return (
                  <span className={cn("mt-1 text-[0.65rem] uppercase tracking-[0.12em]", active ? "text-blush" : "text-[#9a5a4a]")}>
                    {left === 0 ? "Made to order · 4 wks" : `Only ${left} left`}
                  </span>
                );
              })()}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
