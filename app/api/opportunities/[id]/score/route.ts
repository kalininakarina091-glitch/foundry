import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreOpportunity } from "@/lib/scoring";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await prisma.opportunity.findUnique({ where: { id } })))
    return NextResponse.json(
      { error: "Возможность не найдена" },
      { status: 404 },
    );
  return NextResponse.json(await scoreOpportunity(id));
}
