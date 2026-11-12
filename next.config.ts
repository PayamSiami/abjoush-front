import type { NextConfig } from "next";

/**
 * The Django backend serves the dashboard JSON API under `/dashboard/api/`.
 * Env-driven so the same build works locally and in deployment.
 */
const DJANGO_ORIGIN = process.env.DJANGO_API_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Same-origin bridge: the browser calls /dashboard/api/... on :3000
        // and Next proxies it to Django, so no CORS preflight is needed.
        source: "/dashboard/api/:path*",
        destination: `${DJANGO_ORIGIN}/dashboard/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
