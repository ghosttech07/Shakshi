import type { MetadataRoute } from "next";
import { SITE_URL } from "@shakshi/shared/site";
import { getArticles, getCatalog } from "@/lib/data";

export const revalidate = 3600;

// The studio lives on the backend at a private address and is deliberately never listed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, articles] = await Promise.all([getCatalog(), getArticles()]);
  const pages = ["", "/shop", "/quiz", "/build-your-bed", "/sleep-studio", "/sleep-library", "/real-bedrooms", "/about", "/showroom", "/sleep-society", "/gift-cards", "/hospitality", "/setup"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...products.map((p) => ({ url: `${SITE_URL}/mattress/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...articles.map((a) => ({ url: `${SITE_URL}/sleep-library/${a.slug}`, lastModified: a.date, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
