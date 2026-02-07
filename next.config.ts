import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.music.126.net",
      },
      {
        protocol: "http",
        hostname: "*.music.126.net",
      },
    ],
  },
  output: "export",
};

export default nextConfig;
