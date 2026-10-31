import { NextResponse } from "next/server";
import { getOpportunity } from "@/lib/opportunities";
// The same Opportunity Score v2 the pages show: overall, coverage and each
// dimension with its basis, plus the number of traceable materials.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const opportunity = await getOpportunity((await params).id);
  if (!opportunity || opportunity.demo || !opportunity.scoreBreakdown)
    return NextResponse.json(
      { error: "Возможность не найдена" },
      { status: 404 },
    );
  return NextResponse.json({
    ...opportunity.scoreBreakdown,
    materials: opportunity.evidence.length,
  });
}
