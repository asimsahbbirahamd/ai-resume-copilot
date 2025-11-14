import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // allows up to ~10 MB
    },
  },
};

export default nextConfig;
