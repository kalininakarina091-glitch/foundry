import { NextResponse } from "next/server";
import { validateOpportunity } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const report = await validateOpportunity({
      problem: body.problem,
      target_customer: body.target_customer,
      signals: body.signals || [],
      evidence: body.evidence || [],
      competition: body.competition || "Unknown",
      market: body.market || "Unknown",
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate opportunity" },
      { status: 500 }
    );
  }
}