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

export type ArticleRow = Partial<Article> & { published?: boolean; publishAt?: string; deleted?: boolean };
export type StudioArticle = Article & { published: boolean; publishAt?: string; builtIn: boolean };

/**
 * Articles authored in code, overlaid and extended by rows in the `articles` table.
 * The public list leaves out drafts, removed essays and anything scheduled for later.
 */
export async function getArticles(opts: { all?: boolean } = {}): Promise<StudioArticle[]> {
  let rows: { id: string; data: ArticleRow }[] = [];
  try {
    rows = await list<ArticleRow>("articles", { limit: 500 });
  } catch (e) {
    console.error("[articles]", e);
  }
  const bySlug = new Map<string, StudioArticle>(ARTICLES.map((a) => [a.slug, { ...a, published: true, builtIn: true }]));
  const removed = new Set<string>();
  for (const r of rows) {
    if (r.data.deleted) removed.add(r.id);
    const prev = bySlug.get(r.id);
    if (!prev && !r.data.title) continue;
    bySlug.set(r.id, { ...(prev ?? { body: [], builtIn: false, published: false }), ...r.data, slug: r.id, published: r.data.published ?? prev?.published ?? false } as StudioArticle);
  }
  const now = new Date().toISOString();
  return [...bySlug.values()]
    .filter((a) => !removed.has(a.slug))
    .filter((a) => opts.all || (a.published && (!a.publishAt || a.publishAt <= now)))
    .sort((a, b) => b.date.localeCompare(a.date));
}
