import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// The real Saturation API the demo proxies to. Override with SATURATION_API_URL
// when testing against a different environment (local, staging, prod).
const API_ORIGIN =
  process.env.SATURATION_API_URL ?? "http://localhost:4300";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  // Same-origin proxy: the browser calls `/api/sat/v1/*`, Next forwards to the
  // real API. This keeps the Bearer token same-origin (no CORS preflight) and
  // lets the demo ship as a static-friendly app without exposing cross-origin
  // credentials.
  async rewrites() {
    return [
      {
        source: "/api/sat/:path*",
        destination: `${API_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
