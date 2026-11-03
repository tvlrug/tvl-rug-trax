import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hide the Next.js development-only N badge; TRAX supplies its own indicator.
  devIndicators: false,
};

export default nextConfig;
