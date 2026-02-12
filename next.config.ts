import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  // Image optimization: allow external image domains as needed
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },

  // Security and proxy headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Rewrites for proxying session iframe requests to fly.io containers
  async rewrites() {
    return [
      {
        source: "/session/:sessionId/proxy/:path*",
        destination: `${process.env.FLY_PROXY_BASE_URL || "http://localhost:8080"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
