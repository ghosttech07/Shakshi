import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Two root layouts (storefront and studio) need a global 404 for unmatched addresses.
  experimental: { globalNotFound: true },
  images: {
    // All photography is served from Unsplash's CDN, which resizes on the fly.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    qualities: [60, 75, 85],
  },
};

export default nextConfig;
