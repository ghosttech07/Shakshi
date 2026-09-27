"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { ACCESSORIES, PRODUCTS, type Accessory, type Product, type SizeId } from "@shakshi/shared/products";

type Catalog = { products: Product[]; accessories: Accessory[]; stock: Record<string, number | null> };

const Ctx = createContext<Catalog>({ products: PRODUCTS, accessories: ACCESSORIES, stock: {} });

/** The live catalogue (with the team's price, badge and stock edits), provided once from the root layout. */
export function CatalogProvider({ products, accessories, stock, children }: Catalog & { children: ReactNode }) {
  const value = useMemo(() => ({ products, accessories, stock }), [products, accessories, stock]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const { products, accessories, stock } = useContext(Ctx);
  return useMemo(
    () => ({
      products,
      accessories,
      accessory: (id: string) => accessories.find((a) => a.id === id),
      get: (slug: string) => products.find((p) => p.slug === slug),
      /** null = made to order; a number = units left */
      stockFor: (slug: string, size: SizeId): number | null => stock[`${slug}:${size}`] ?? null,
    }),
    [products, accessories, stock]
  );
}
