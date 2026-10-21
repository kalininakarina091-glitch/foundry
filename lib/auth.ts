import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { newToken, tokenDigest } from "./auth-crypto";
import { SESSION_COOKIE } from "./auth-constants";
import { configuredAppOrigin } from "./app-origin";
import { databaseConfigured } from "./deployment";
import { clientIp, limitKey } from "./client-ip";
import { consumeLimits } from "./rate-limit";
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
const MINUTE = 60000;
// Per address and per account, never site-wide: one client must not be able
// to lock everyone else out of sign-in.
export function allowAuthAttempt(
  request: Request,
  email: string,
  kind: "login" | "register",
) {
  const ip = clientIp(request);
  return consumeLimits(
    kind === "login"
      ? [
          { key: limitKey("login-ip", ip), max: 30, windowMs: 15 * MINUTE },
          { key: limitKey("login-email", email), max: 10, windowMs: 15 * MINUTE },
        ]
      : [
          { key: limitKey("register-ip", ip), max: 5, windowMs: 60 * MINUTE },
          { key: limitKey("register-email", email), max: 10, windowMs: 15 * MINUTE },
        ],
  );
}
