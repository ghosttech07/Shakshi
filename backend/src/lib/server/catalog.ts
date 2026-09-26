import { PRODUCTS, SIZES, type Product, type SizeId } from "@shakshi/shared/products";
import { ARTICLES, type Article } from "@shakshi/shared/articles";
import { IMG } from "@shakshi/shared/images";
import { list } from "./db";

/**
 * The catalogue = the built-in collection, with the studio's edits laid over it, plus any
 * mattresses created in the studio. A `products` row holds either a partial override
 * (for a built-in slug) or a complete product; `deleted: true` removes one.
 */
export type ProductRow = Partial<Product> & { deleted?: boolean };

/** Units available per size. `null` = made to order (no stock limit). */
export type StockMap = Record<string, number | null>;
export const stockKey = (slug: string, size: SizeId) => `${slug}:${size}`;

/** Sensible defaults for a mattress created from scratch in the studio. */
export const NEW_PRODUCT: Product = {
  ...PRODUCTS.find((p) => p.slug === "signature")!,
  slug: "",
  name: "",
  tier: "New",
  tagline: "",
  feeling: "Restored",
  description: "",
  badge: undefined,
  images: [IMG.linen],
  rating: 5,
  reviewCount: 0,
  published: false,
};

async function rows() {
  try {
    return await list<ProductRow>("products", { limit: 200 });
  } catch (e) {
    console.error("[catalog] falling back to built-in catalogue", e);
    return [];
  }
}

export async function getCatalog(opts: { includeUnpublished?: boolean } = {}): Promise<Product[]> {
  const byId = new Map((await rows()).map((r) => [r.id, r.data]));
  const out: Product[] = [];
  for (const p of PRODUCTS) {
    const o = byId.get(p.slug);
    if (o?.deleted) continue;
    out.push(o ? { ...p, ...o, slug: p.slug } : p);
  }
  for (const [id, data] of byId) {
    if (PRODUCTS.some((p) => p.slug === id) || data.deleted || !data.name) continue;
    out.push({ ...NEW_PRODUCT, ...data, slug: id } as Product);
  }
  return out.filter((p) => opts.includeUnpublished || p.published !== false);
}

export async function getStock(): Promise<StockMap> {
  const map: StockMap = {};
  try {
    const rows = await list<{ qty: number | null }>("stock", { limit: 500 });
    for (const r of rows) map[r.id] = r.data.qty;
  } catch (e) {
    console.error("[stock]", e);
  }
  return map;
}

export const sizesOf = () => SIZES.map((s) => s.id);

/** Articles authored in code, overlaid and extended by rows in the `articles` table. */
export async function getArticles(): Promise<Article[]> {
  let extra: Article[] = [];
  try {
    const rows = await list<Article & { published?: boolean }>("articles", { limit: 200 });
    extra = rows.filter((r) => r.data.published !== false).map((r) => ({ ...r.data, slug: r.id }));
  } catch (e) {
    console.error("[articles]", e);
  }
  const bySlug = new Map(ARTICLES.map((a) => [a.slug, a]));
  for (const a of extra) bySlug.set(a.slug, { ...bySlug.get(a.slug), ...a });
  return [...bySlug.values()].sort((a, b) => b.date.localeCompare(a.date));
}
