import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await prisma.opportunity.findUnique({ where: { id } })))
    return NextResponse.json(
      { error: "Возможность не найдена" },
      { status: 404 },
    );
  await prisma.$transaction([
    prisma.evidence.deleteMany({ where: { opportunityId: id } }),
    prisma.opportunity.update({ where: { id }, data: { score: 0 } }),
  ]);
  return NextResponse.json({ cleared: true, score: 0 });
}
