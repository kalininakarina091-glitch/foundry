import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { extractRawItem } from "@/lib/extraction";
export const maxDuration = 300;
export async function POST(request: Request) {
  const body = z
    .object({ limit: z.number().int().min(1).max(5).default(3) })
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: "limit должен быть от 1 до 5" },
      { status: 400 },
    );
  if (!process.env.OPENROUTER_API_KEY)
    return NextResponse.json(
      { error: "AI-провайдер не настроен" },
      { status: 503 },
    );
  const records = await prisma.rawItem.findMany({
    where: { extractionStatus: "pending", signals: { none: {} } },
    orderBy: [{ fetchedAt: "asc" }, { id: "asc" }],
    take: body.data.limit,
  });
  const results = [];
  for (const raw of records)
    results.push({ rawItemId: raw.id, ...(await extractRawItem(raw.id)) });
  return NextResponse.json({
    processed: results.length,
    relevant: results.filter((r) => r.is_relevant).length,
    skipped: results.filter((r) => r.skipped || r.is_relevant === false).length,
    errors: results.filter((r) => r.status >= 400).length,
    results,
  });
}
