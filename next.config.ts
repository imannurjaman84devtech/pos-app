import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: [
    "192.168.18.168",
  ],
};

export default nextConfig;