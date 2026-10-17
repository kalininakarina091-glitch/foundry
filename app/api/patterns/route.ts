import { NextResponse } from "next/server";
import { detectPatterns } from "@/lib/patterns";

export async function GET() {
  try {
    const patterns = await detectPatterns();
    return NextResponse.json(patterns);
  } catch (error) {
    console.error("Pattern detection error:", error);
    return NextResponse.json(
      { error: "Ошибка обнаружения паттернов" },
      { status: 500 },
    );
  }
}
