import type { MetadataRoute } from "next";
import { SITE_URL } from "@shakshi/shared/site";
import { getArticles, getCatalog, getRouting } from "@/lib/data";
import { ACCESSORY_RANGES } from "@shakshi/shared/products";

export const revalidate = 3600;

// The studio lives on the backend at a private address and is deliberately never listed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles, routing] = await Promise.all([getCatalog(), getArticles(), getRouting()]);
  return [
    ...routing.pages.map((p) => ({ url: `${SITE_URL}${p.slug ? `/${p.slug}` : ""}`, lastModified: p.updatedAt || undefined, changeFrequency: "weekly" as const, priority: p.slug === "" ? 1 : p.slug.startsWith("policies/") ? 0.3 : 0.8 })),
    ...ACCESSORY_RANGES.map((r) => ({ url: `${SITE_URL}/shop/${r.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${SITE_URL}/mattress/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...articles.map((a) => ({ url: `${SITE_URL}/sleep-library/${a.slug}`, lastModified: a.date, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
