import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractSignals } from "@/lib/ai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
  });

  if (!opportunity) {
    return NextResponse.json(
      { error: "Возможность не найдена. Демо не записывается в базу." },
      { status: 404 },
    );
  }

  // Берём сигналы, которые ещё не привязаны
  const signals = await prisma.signal.findMany({
    where: {
      evidence: { none: { opportunityId: id } },
    },
    include: {
      rawItem: {
        include: { source: true },
      },
    },
    take: body.limit || 10,
  });

  let linked = 0;
  let skipped = 0;

  // Фильтруем сигналы по релевантности через AI
  for (const signal of signals) {
    try {
      const relevanceCheck = await extractSignals({
        title: signal.title,
        content: `${opportunity.title}. ${opportunity.description}. Signal: ${signal.title} ${signal.pain || ""}`,
        sourceType: "relevance-check",
      });

      // Если AI считает, что сигнал не релевантен — пропускаем
      if (!relevanceCheck.is_relevant) {
        skipped++;
        continue;
      }

      // Relevance is not polarity: a complaint about a competitor may support this opportunity.
      const evidenceType = "neutral";

      await prisma.evidence.create({
        data: {
          opportunityId: id,
          signalId: signal.id,
          claim: signal.title || signal.description || "Signal detected",
          evidenceType,
          strength: signal.strength,
          sourceUrl: signal.rawItem?.url || null,
        },
      });

      linked++;
    } catch (error) {
      console.error(`Failed to check signal ${signal.id}:`, error);
      skipped++;
    }
  }

  return NextResponse.json({
    linked,
    skipped,
    total: signals.length,
  });
}
