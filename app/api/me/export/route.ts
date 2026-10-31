import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { decodeProfile } from "@/lib/personal-profile";
import { parsePreferences } from "@/lib/preferences";
// The signed-in user's own data as one JSON file. Password and session token
// hashes are never included; shared market data is referenced by title only.
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  const [account, profile, saved, feedback, decisions, plans, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true, isAdmin: true, createdAt: true },
    }),
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.savedOpportunity.findMany({
      where: { userId: user.id },
      select: { createdAt: true, opportunity: { select: { id: true, title: true } } },
    }),
    prisma.opportunityFeedback.findMany({
      where: { userId: user.id },
      select: { kind: true, createdAt: true, opportunity: { select: { id: true, title: true } } },
    }),
    prisma.opportunityDecision.findMany({
      where: { userId: user.id },
      select: { status: true, note: true, updatedAt: true, opportunity: { select: { id: true, title: true } } },
    }),
    prisma.opportunityPlan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, model: true, content: true, opportunity: { select: { id: true, title: true } } },
    }),
    prisma.session.findMany({
      where: { userId: user.id },
      select: { createdAt: true, expiresAt: true },
    }),
  ]);
  const json = (value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };
  const data = {
    exportedAt: new Date().toISOString(),
    format: "foundry-personal-data-v1",
    account,
    profile: { ...decodeProfile(profile), about: profile?.about ?? "" },
    preferences: parsePreferences(profile?.preferences || "{}"),
    saved,
    feedback,
    decisions,
    plans: plans.map((p) => ({ ...p, content: json(p.content) })),
    sessions,
  };
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="foundry-my-data-${day}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
