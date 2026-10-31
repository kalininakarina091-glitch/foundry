import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentSessionDigest, currentUser, endOtherSessions } from "@/lib/auth";
// Sessions store only token digests and dates; no device data is collected.
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  const current = await currentSessionDigest();
  const sessions = await prisma.session.findMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { tokenHash: true, createdAt: true, expiresAt: true },
  });
  return NextResponse.json(
    sessions.map((s) => ({
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      current: s.tokenHash === current,
    })),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function DELETE() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  return NextResponse.json({ revoked: await endOtherSessions(user.id) });
}
