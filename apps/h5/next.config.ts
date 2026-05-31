import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.1.94",
    "192.168.1.238",
  ],
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  transpilePackages: ["@ai-code/shared-ui"],
};

export default nextConfig;
