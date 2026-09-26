import { NextResponse } from "next/server";
import { scoreOpportunity } from "@/lib/scoring";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const score = await scoreOpportunity(id);
    return NextResponse.json(score);
  } catch {
    return NextResponse.json({ error: "Ошибка скоринга" }, { status: 500 });
  }
}
