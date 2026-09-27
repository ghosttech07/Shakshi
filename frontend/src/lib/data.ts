import "server-only";
import { PRODUCTS, type Product, type Review } from "@shakshi/shared/products";
import { ARTICLES, type Article } from "@shakshi/shared/articles";
import { DEFAULT_PAGES, DEFAULT_SITE } from "@shakshi/shared/cms/defaults";
import type { PageDoc, SiteConfig } from "@shakshi/shared/cms/types";

/**
 * The storefront's only doorway to the backend for page data. Every call has a short timeout and
 * a built-in fallback, so the shop keeps rendering (with the house content) if the backend is down.
 */
const API = process.env.API_URL ?? "http://localhost:4000";
export const BACKEND_TAG = "backend";

async function fromBackend<T>(path: string, fallback: T, revalidate = 60): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate, tags: [BACKEND_TAG] }, signal: AbortSignal.timeout(2500) });
    if (res.status === 404) return fallback;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[storefront] backend unavailable for ${path} (${(e as Error).message}); using built-in content`);
    return fallback;
  }
}

export type Storefront = { products: Product[]; stock: Record<string, number | null>; site: SiteConfig };

export const getStorefront = async (): Promise<Storefront> => {
  const r = await fromBackend<Partial<Storefront>>("/api/public/storefront", {});
  return {
    products: r.products ?? PRODUCTS.filter((p) => p.published !== false),
    stock: r.stock ?? {},
    site: r.site ?? DEFAULT_SITE,
  };
};

export const getSite = async () => (await getStorefront()).site;
export const getCatalog = async () => (await getStorefront()).products;

/** A published page, or the built-in default for system pages; null when no page lives at that address. */
export async function getPage(slug: string): Promise<PageDoc | null> {
  const fallback = DEFAULT_PAGES.find((p) => p.slug === slug) ?? null;
  const r = await fromBackend<{ page?: PageDoc }>(`/api/public/page?slug=${encodeURIComponent(slug)}`, { page: fallback ?? undefined });
  return r.page ?? fallback;
}

export const getArticles = async () =>
  (await fromBackend<{ articles: Article[] }>("/api/public/articles", { articles: [...ARTICLES].sort((a, b) => b.date.localeCompare(a.date)) }, 120)).articles;

export const getApprovedReviews = async (slug: string) =>
  (await fromBackend<{ reviews: Review[] }>(`/api/reviews?product=${encodeURIComponent(slug)}`, { reviews: [] })).reviews;

/** Published page addresses for the sitemap (built-in pages when the backend is away). */
export const getRouting = () =>
  fromBackend<{ pages: { slug: string; updatedAt?: string }[] }>("/api/public/routing", { pages: DEFAULT_PAGES.map((p) => ({ slug: p.slug })) }, 300);
