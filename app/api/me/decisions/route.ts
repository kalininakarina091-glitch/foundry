import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { decisionSchema, isEmptyDecision } from "@/lib/decisions";
// Personal decisions and notes. Owned by the signed-in user only; they never
// change shared market data, Opportunity Score or Validation.
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  return NextResponse.json(
    await prisma.opportunityDecision.findMany({
      where: { userId: user.id },
      select: { opportunityId: true, status: true, note: true, updatedAt: true },
    }),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  const p = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: "Некорректное решение" }, { status: 400 });
  const { opportunityId, status, note } = p.data;
  if (
    !(await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true },
    }))
  )
    return NextResponse.json({ error: "Возможность не найдена" }, { status: 404 });
  const key = { userId: user.id, opportunityId };
  if (isEmptyDecision({ status, note })) {
    await prisma.opportunityDecision.deleteMany({ where: key });
    return NextResponse.json({ opportunityId, status: null, note: "" });
  }
  const saved = await prisma.opportunityDecision.upsert({
    where: { userId_opportunityId: key },
    create: { ...key, status, note },
    update: { status, note },
    select: { opportunityId: true, status: true, note: true, updatedAt: true },
  });
  return NextResponse.json(saved);
}
