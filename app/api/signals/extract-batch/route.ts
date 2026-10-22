import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  extractRawItem,
  extractionAttempts,
  readMetadata,
  MAX_EXTRACTION_ATTEMPTS,
} from "@/lib/extraction";
export const maxDuration = 300;
export async function POST(request: Request) {
  const body = z
    .object({
      limit: z.number().int().min(1).max(5).default(3),
      retryFailed: z.boolean().default(false),
    })
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
  const { limit, retryFailed } = body.data;
  const candidates = await prisma.rawItem.findMany({
    where: {
      extractionStatus: retryFailed ? "failed" : "pending",
      signals: { none: {} },
      source: { status: "active" },
    },
    orderBy: [{ fetchedAt: "asc" }, { id: "asc" }],
    // Attempts live in metadata JSON, so failed records are filtered here.
    take: retryFailed ? 200 : limit,
    select: { id: true, metadata: true },
  });
  const records = candidates
    .filter(
      (r) =>
        !retryFailed ||
        extractionAttempts(readMetadata(r.metadata)) < MAX_EXTRACTION_ATTEMPTS,
    )
    .slice(0, limit);
  const results = [];
  for (const raw of records)
    results.push({ rawItemId: raw.id, ...(await extractRawItem(raw.id)) });
  const failures: Record<string, number> = {};
  for (const r of results)
    if ("reason" in r && r.status >= 400 && typeof r.reason === "string")
      failures[r.reason] = (failures[r.reason] || 0) + 1;
  return NextResponse.json({
    processed: results.length,
    relevant: results.filter((r) => "is_relevant" in r && r.is_relevant).length,
    skipped: results.filter(
      (r) =>
        ("skipped" in r && r.skipped) ||
        ("is_relevant" in r && r.is_relevant === false),
    ).length,
    errors: results.filter((r) => r.status >= 400).length,
    failures,
    results,
  });
}
