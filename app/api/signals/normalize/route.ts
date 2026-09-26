import { NextResponse } from "next/server";
import { normalizeAllSignals } from "@/lib/normalize";

export async function POST() {
  try {
    const result = await normalizeAllSignals();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Normalization error:", error);
    return NextResponse.json({ error: "Ошибка нормализации" }, { status: 500 });
  }
}
