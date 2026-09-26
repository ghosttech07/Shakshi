import type { MetadataRoute } from "next";
import { SITE_URL } from "@shakshi/shared/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/checkout", "/wishlist", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
