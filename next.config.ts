import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
