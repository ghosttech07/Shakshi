import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["@shakshi/shared"],
  serverExternalPackages: ["sharp"],
  images: { unoptimized: true },
  async headers() {
    // Nothing the backend serves is meant for search engines.
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
