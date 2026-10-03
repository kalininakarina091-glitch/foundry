import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { newToken, tokenDigest } from "./auth-crypto";
import { SESSION_COOKIE } from "./auth-constants";
import { configuredAppOrigin } from "./app-origin";
import { databaseConfigured } from "./deployment";
export { SESSION_COOKIE } from "./auth-constants";
export async function sessionUser(token?: string) {
  if (!databaseConfigured()) return null;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenDigest(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, name: true, email: true, isAdmin: true } },
    },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function currentUser() {
  return sessionUser((await cookies()).get(SESSION_COOKIE)?.value);
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
export async function createSession(userId: string, request: Request) {
  const jar = await cookies();
  const previous = jar.get(SESSION_COOKIE)?.value;
  const token = newToken(),
    expiresAt = new Date(Date.now() + 7 * 86400000);
  await prisma.$transaction(async (tx) => {
    if (previous)
      await tx.session.deleteMany({
        where: { tokenHash: tokenDigest(previous) },
      });
    await tx.session.create({
      data: { userId, tokenHash: tokenDigest(token), expiresAt },
    });
  });
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure:
      new URL(configuredAppOrigin() || request.url).protocol === "https:",
    path: "/",
    expires: expiresAt,
  });
}
export async function endSession() {
  const jar = await cookies(),
    token = jar.get(SESSION_COOKIE)?.value;
  if (token)
    await prisma.session.deleteMany({
      where: { tokenHash: tokenDigest(token) },
    });
  jar.delete(SESSION_COOKIE);
}
export async function allowAuthAttempt(email: string) {
  const now = new Date(),
    expiresAt = new Date(Date.now() + 15 * 60000);
  for (const [key, max] of [
    ["auth-global", 60],
    [`auth-${tokenDigest(email)}`, 10],
  ] as const) {
    await prisma.authThrottle.updateMany({
      where: { key, expiresAt: { lte: now } },
      data: { attempts: 0, expiresAt },
    });
    const entry = await prisma.authThrottle.upsert({
      where: { key },
      create: { key, attempts: 1, expiresAt },
      update: { attempts: { increment: 1 } },
    });
    if (entry.attempts > max) return false;
  }
  return true;
}
