import type { NextConfig } from "next";

/**
 * Cache Components / partial prefetching are intentionally OFF for Phase 1: every app page is
 * authenticated and request-bound (wallet, cookies, live chain reads). Revisit once the
 * marketing surface grows.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@tradh/core", "@tradh/chain", "@tradh/db"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
