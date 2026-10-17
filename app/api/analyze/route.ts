import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Непроверяемый анализ произвольного текста отключён. Используйте /api/validate с opportunityId и связанными первоисточниками.",
    },
    { status: 410 },
  );
}
