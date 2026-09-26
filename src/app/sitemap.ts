import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/shop", "/quiz", "/build-your-bed", "/sleep-studio", "/about", "/showroom"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...PRODUCTS.map((p) => ({ url: `${SITE_URL}/mattress/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.9 })),
  ];
}
