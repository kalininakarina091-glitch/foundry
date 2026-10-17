import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify URL variables are build metadata and may not exist in Functions.
  env: {
    FOUNDRY_PLATFORM: process.env.NETLIFY === "true" ? "netlify" : "local",
    FOUNDRY_DEPLOY_ORIGIN:
      process.env.NETLIFY === "true"
        ? process.env.DEPLOY_PRIME_URL || process.env.URL || ""
        : "",
  },
  distDir: process.env.FOUNDRY_AUDIT_BUILD === "1" ? ".next-audit" : ".next",
  // Restricted desktop environments can use threads instead of child processes.
  ...(process.env.FOUNDRY_BUILD_THREADS === "1"
    ? {
        experimental: {
          webpackBuildWorker: false,
          workerThreads: true,
          cpus: 2,
          useTypeScriptCli: false,
        },
      }
    : {}),
};

export default nextConfig;
