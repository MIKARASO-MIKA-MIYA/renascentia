import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.RENASCENTIA_BROWSER_TEST === "1"
    ? {
        distDir: ".next/cms-browser",
        typescript: { tsconfigPath: "tests/tsconfig.browser.json" },
        agentRules: false,
      }
    : {}),
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
