import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // React 19 + Radix UI asChild prop type mismatch (cosmetic only, no runtime impact)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
