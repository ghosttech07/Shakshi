import "server-only";
import { PRODUCTS, type Product, type Review } from "@shakshi/shared/products";
import { ARTICLES, type Article } from "@shakshi/shared/articles";
import { DEFAULT_SETTINGS } from "@shakshi/shared/settings";
import type { StoreSettings } from "@shakshi/shared/records";

/**
 * The storefront's only doorway to the backend for page data. Every call has a short timeout and
 * a built-in fallback, so the shop keeps rendering (with the house catalogue) if the backend is down.
 */
const API = process.env.API_URL ?? "http://localhost:4000";
export const BACKEND_TAG = "backend";

async function fromBackend<T>(path: string, fallback: T, revalidate = 60): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate, tags: [BACKEND_TAG] }, signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[storefront] backend unavailable for ${path} (${(e as Error).message}); using built-in data`);
    return fallback;
  }
}

export type Storefront = { products: Product[]; stock: Record<string, number | null>; settings: StoreSettings };

export const getStorefront = () =>
  fromBackend<Storefront>("/api/public/storefront", { products: PRODUCTS.filter((p) => p.published !== false), stock: {}, settings: DEFAULT_SETTINGS });

export const getCatalog = async () => (await getStorefront()).products;

export const getArticles = async () =>
  (await fromBackend<{ articles: Article[] }>("/api/public/articles", { articles: [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date)) }, 120)).articles;

export const getApprovedReviews = async (slug: string) =>
  (await fromBackend<{ reviews: Review[] }>(`/api/reviews?product=${encodeURIComponent(slug)}`, { reviews: [] })).reviews;
