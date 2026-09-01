import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // pdf-parse (via pdfjs-dist) resolves its worker file relative to its own
  // module location at runtime. Bundling it rewrites that path into a
  // Turbopack chunk that doesn't carry the sibling worker file, breaking
  // extraction with "Setting up fake worker failed". Keeping it external
  // makes Node resolve it natively from node_modules instead.
  // Stagehand resolves its bundled extension assets relative to its own
  // module location at runtime (`new URL("../", import.meta.url)`). Bundling
  // it rewrites that into a Turbopack chunk with no sibling asset folder,
  // breaking with "Module not found: Can't resolve '../'". Same class of fix
  // as pdf-parse below — keep it external so Node resolves it natively.
  serverExternalPackages: ["pdf-parse", "@browserbasehq/stagehand"],
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
