import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractSignals } from "@/lib/ai";

export const maxDuration = 120;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const body = await request.json();
  const limit = body.limit || 5;

  const rawItems = await prisma.rawItem.findMany({
    where: {
      signals: { none: {} },
    },
    include: { source: true },
    take: limit,
  });

  if (rawItems.length === 0) {
    return NextResponse.json({
      processed: 0,
      message: "Нет RawItems для обработки",
    });
  }

  let relevant = 0;
  let skipped = 0;
  let errors = 0;

  for (const rawItem of rawItems) {
    try {
      const extraction = await extractSignals({
        title: rawItem.title,
        content: rawItem.content,
        sourceType: rawItem.source.type,
      });

      if (!extraction.is_relevant) {
        skipped++;
      } else {
        await prisma.signal.create({
          data: {
            rawItemId: rawItem.id,
            type: extraction.signal_type || "trend",
            title: extraction.problem || rawItem.title,
            description: extraction.pain_point || rawItem.content,
            pain: extraction.pain_point,
            customer: extraction.customer,
            industry: extraction.industry,
            strength: extraction.strength,
          },
        });
        relevant++;
      }
    } catch (error) {
      console.error(`Failed to process ${rawItem.id}:`, error);
      errors++;
    }

    // Ждём 15 секунд между запросами (лимит Gemini: 5/мин)
    await sleep(15000);
  }

  return NextResponse.json({
    processed: rawItems.length,
    relevant,
    skipped,
    errors,
  });
}
