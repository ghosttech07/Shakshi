import type { NextConfig } from "next";
import { backendUrl } from "./src/lib/backend-url";

// The backend (API, database, studio). The storefront keeps working if it's unreachable.
const API_URL = backendUrl();

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["@shakshi/shared"],
  images: {
    // All photography is served from Unsplash's CDN, which resizes on the fly.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    qualities: [60, 75, 85],
  },
  async redirects() {
    // The studio runs on the backend; /admin on the shop takes you there.
    const studio = process.env.STUDIO_URL?.trim().replace(/\/+$/, "") || `${API_URL}/admin`;
    return [
      { source: "/admin", destination: studio, permanent: false },
      { source: "/admin/:path*", destination: `${studio}/:path*`, permanent: false },
      // Retired pages: old links and bookmarks land on the collection.
      { source: "/quiz", destination: "/shop", permanent: true },
      { source: "/build-your-bed", destination: "/shop", permanent: true },
      { source: "/real-bedrooms", destination: "/shop", permanent: true },
      { source: "/policies/trial", destination: "/policies/returns", permanent: true },
    ];
  },
  async rewrites() {
    // Browser calls to /api/* go to the backend (same origin, so no CORS and no exposed backend URL).
    // Routes that exist here (e.g. /api/revalidate) are matched first.
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
