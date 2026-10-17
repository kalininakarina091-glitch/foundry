import { NextResponse } from "next/server";
import { clusterSignals } from "@/lib/cluster";

export async function GET() {
  try {
    const clusters = await clusterSignals();
    return NextResponse.json(clusters);
  } catch (error) {
    console.error("Clustering error:", error);
    return NextResponse.json(
      { error: "Ошибка кластеризации" },
      { status: 500 },
    );
  }
}
