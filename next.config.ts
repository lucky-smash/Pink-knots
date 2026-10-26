import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets a production build run beside the dev server (NEXT_DIST_DIR=.next-prod).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    // Product photos are pre-sized to WebP by scripts/fetch-images.mjs.
    unoptimized: true,
  },
  transpilePackages: ["three"],
};

export default nextConfig;
