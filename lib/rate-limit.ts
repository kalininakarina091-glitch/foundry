import { prisma } from "@/lib/db";
export interface Limit {
  key: string;
  max: number;
  windowMs: number;
}
/**
 * Fixed-window counters in AuthThrottle. Every listed limit is counted; the
 * call is allowed only when none is exceeded. Expired windows are removed.
 */
export async function consumeLimits(limits: Limit[]): Promise<boolean> {
  const now = new Date();
  await prisma.authThrottle.deleteMany({ where: { expiresAt: { lte: now } } });
  let allowed = true;
  for (const { key, max, windowMs } of limits) {
    const entry = await prisma.authThrottle.upsert({
      where: { key },
      create: { key, attempts: 1, expiresAt: new Date(now.getTime() + windowMs) },
      update: { attempts: { increment: 1 } },
    });
    if (entry.attempts > max) allowed = false;
  }
  return allowed;
}
