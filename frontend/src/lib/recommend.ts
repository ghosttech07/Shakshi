import type { Product } from "@shakshi/shared/products";

export type Signals = { recent?: string[]; wishlist?: string[]; exclude?: string[] };
export type Recommendation = { product: Product; reason: string; score: number };

/**
 * Blends what a visitor has kept (wishlist) and looked at (history) into a short,
 * explained list. Returns nothing when there are no signals, so generic rows can stay generic.
 */
export function recommend(products: Product[], s: Signals, n = 3): Recommendation[] {
  const recent = s.recent ?? [];
  const wishlist = s.wishlist ?? [];
  if (!recent.length && !wishlist.length) return [];

  const viewed = recent.map((slug) => products.find((p) => p.slug === slug)).filter((p): p is Product => !!p);

  const out = products
    .filter((p) => !s.exclude?.includes(p.slug))
    .map((p) => {
      const reasons: { text: string; weight: number }[] = [];
      if (wishlist.includes(p.slug)) reasons.push({ text: "Saved to your wishlist", weight: 40 });
      const idx = recent.indexOf(p.slug);
      if (idx >= 0) reasons.push({ text: "You looked at this recently", weight: 22 - idx * 3 });
      const similar = viewed.find((v) => v.slug !== p.slug && Math.abs(v.firmness - p.firmness) <= 1);
      if (similar) reasons.push({ text: `Close in feel to ${similar.name}`, weight: 18 });
      reasons.sort((a, b) => b.weight - a.weight);
      const score = reasons.reduce((sum, r, i) => sum + r.weight / (i + 1), 0);
      return { product: p, reason: reasons[0]?.text ?? "", score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  return out.slice(0, n);
}
