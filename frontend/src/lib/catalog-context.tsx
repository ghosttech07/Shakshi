"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { PRODUCTS, type Product, type SizeId } from "@shakshi/shared/products";

type Catalog = { products: Product[]; stock: Record<string, number | null> };

const Ctx = createContext<Catalog>({ products: PRODUCTS, stock: {} });

/** The live catalogue (with the team's price, badge and stock edits), provided once from the root layout. */
export function CatalogProvider({ products, stock, children }: Catalog & { children: ReactNode }) {
  const value = useMemo(() => ({ products, stock }), [products, stock]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const { products, stock } = useContext(Ctx);
  return useMemo(
    () => ({
      products,
      get: (slug: string) => products.find((p) => p.slug === slug),
      /** null = made to order; a number = units left */
      stockFor: (slug: string, size: SizeId): number | null => stock[`${slug}:${size}`] ?? null,
    }),
    [products, stock]
  );
}
