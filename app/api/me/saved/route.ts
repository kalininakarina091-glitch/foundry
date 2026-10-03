import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  return NextResponse.json(
    await prisma.savedOpportunity.findMany({
      where: { userId: user.id },
      select: { opportunityId: true },
    }),
  );
}
export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите" }, { status: 401 });
  const p = z
    .object({ opportunityId: z.string().min(1), active: z.boolean() })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  const { opportunityId, active } = p.data;
  if (
    !(await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true },
    }))
  )
    return NextResponse.json(
      { error: "Возможность не найдена" },
      { status: 404 },
    );
  const key = { userId: user.id, opportunityId };
  if (active)
    await prisma.savedOpportunity.upsert({
      where: { userId_opportunityId: key },
      create: { ...key },
      update: {},
    });
  else await prisma.savedOpportunity.deleteMany({ where: key });
  return NextResponse.json({ ok: true });
}
