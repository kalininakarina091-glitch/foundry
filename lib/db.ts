import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(process.env.DATABASE_URL
      ? { datasourceUrl: runtimeDatabaseUrl(process.env.DATABASE_URL) }
      : {}),
  });

// Reuse one pool per warm process, including production serverless invocations.
globalForPrisma.prisma = prisma;

function runtimeDatabaseUrl(value: string) {
  // Invalid configuration is handled by the deployment guard, not module load.
  try {
    const url = new URL(value);
    if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "2");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "10");
    return url.toString();
  } catch { return value; }
}
