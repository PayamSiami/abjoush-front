import type { NextConfig } from "next";

/**
 * The Django backend serves the dashboard JSON API under `/dashboard/api/`.
 * Env-driven so the same build works locally and in deployment.
 */
const DJANGO_ORIGIN = process.env.DJANGO_API_ORIGIN ?? "http://127.0.0.1:8000";

/**
 * Bridges the browser's same-origin `/dashboard/api/...` calls to Django,
 * so the dashboard needs no CORS handling and no absolute URL.
 *
 * Note on the trailing slash: `:path*` swallows the trailing slash, which
 * yields a double-slash destination and a 308/301 redirect loop. Django's
 * APPEND_SLASH requires the canonical trailing slash, so instead of relying
 * on a wildcard we forward the request to Django over a path that is itself
 * slash-normalised, and let Django redirect once if needed.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/dashboard/api/:path*",
        destination: `${DJANGO_ORIGIN}/dashboard/api/:path*/`,
      },
      {
        source: "/api/:path*",
        destination: `${DJANGO_ORIGIN}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
