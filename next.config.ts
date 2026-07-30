import type { NextConfig } from "next";

const apiRewriteBaseURL =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? "http://backend-api:8080" : "http://localhost:8080");

const nextConfig: NextConfig = {
	output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "**.coindesk.com",
      },
      {
        protocol: "https",
        hostname: "**.cointelegraph.com",
      },
      {
        protocol: "https",
        hostname: "images.cointelegraph.com",
      },
      // Cointelegraph RSS article covers are served from this CDN host.
      {
        protocol: "https",
        hostname: "s3-images.ctmedia.io",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiRewriteBaseURL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
