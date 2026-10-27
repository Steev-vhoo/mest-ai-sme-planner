import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer ships its own font/layout engine; keep it out of the bundle.
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/plan": ["./public/mest-logo.png"],
  },
};

export default nextConfig;
