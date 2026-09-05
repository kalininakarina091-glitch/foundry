import { NextResponse } from "next/server";
import { analyzeOpportunity } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const analysis = await analyzeOpportunity({
      problem: body.problem,
      signals: body.signals || [],
      evidence: body.evidence || [],
      market: body.market || "Unknown",
      competition: body.competition || "Unknown",
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze opportunity" },
      { status: 500 }
    );
  }
}