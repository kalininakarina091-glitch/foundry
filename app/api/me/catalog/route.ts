import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decodeProfile } from "@/lib/personal-profile";
import { opportunityAttributes, matchOpportunity } from "@/lib/personalization";
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  const [row, saved, feedback, opportunities] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.savedOpportunity.findMany({ where: { userId: user.id } }),
    prisma.opportunityFeedback.findMany({ where: { userId: user.id } }),
    prisma.opportunity.findMany({
      select: { id: true, matchAttributes: true, industry: true },
    }),
  ]);
  const profile = decodeProfile(row);
  return NextResponse.json({
    limited: !profile.onboardingCompleted,
    saved: saved.map((s) => s.opportunityId),
    dismissed: feedback.map((f) => f.opportunityId),
    matches: Object.fromEntries(
      opportunities.map((o) => [
        o.id,
        matchOpportunity(
          profile,
          opportunityAttributes(o.matchAttributes, o.industry),
          feedback.some((f) => f.opportunityId === o.id),
        ),
      ]),
    ),
  });
}
