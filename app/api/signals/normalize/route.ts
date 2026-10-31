import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { normalizeAllSignals } from "@/lib/normalize";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const result = await normalizeAllSignals();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Normalization error:", error);
    return NextResponse.json({ error: "Ошибка нормализации" }, { status: 500 });
  }
}
