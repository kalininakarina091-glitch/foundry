import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { detectPatterns } from "@/lib/patterns";
import { generateOpportunityFromCluster } from "@/lib/opportunity-generator";
import { scoreSignals } from "@/lib/scoring";
import { AI_MODEL } from "@/lib/ai";
export async function POST(request: Request) {
  const parsed = z
    .object({ patternId: z.string().min(1).max(200) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "Передайте patternId из /api/patterns; поиск по ключевым словам больше не поддерживается.",
      },
      { status: 400 },
    );
  const existing = await prisma.opportunity.findUnique({
    where: { generationKey: parsed.data.patternId },
  });
  if (existing)
    return NextResponse.json({
      ...existing,
      savedId: existing.id,
      reused: true,
    });
  const pattern = (await detectPatterns()).find(
    (p) => p.id === parsed.data.patternId,
  );
  if (!pattern?.shouldCreateOpportunity)
    return NextResponse.json(
      { error: "Паттерн отсутствует или устарел. Обновите список." },
      { status: 409 },
    );
  if (pattern.signalIds.length > 40)
    return NextResponse.json(
      {
        error:
          "Кластер превышает текущий лимит 40 сигналов; требуется ручное уточнение.",
      },
      { status: 422 },
    );
  if (!process.env.OPENROUTER_API_KEY)
    return NextResponse.json(
      { error: "AI-провайдер не настроен" },
      { status: 503 },
    );
  try {
    const signals = await prisma.signal.findMany({
      where: { id: { in: pattern.signalIds } },
      include: { rawItem: { include: { source: true } } },
    });
    const result = await generateOpportunityFromCluster(
      pattern.clusterName,
      signals,
    );
    const supporting = signals.filter((s) =>
      result.supporting_signal_ids.includes(s.id),
    );
    const score = scoreSignals(supporting);
    const provenance = JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      model: AI_MODEL,
      pattern,
      signals: supporting.map((s) => ({
        signalId: s.id,
        rawItemId: s.rawItemId,
        sourceId: s.rawItem.sourceId,
        url: s.rawItem.url,
        quote: s.description,
        claim: s.title,
      })),
    });
    const saved = await prisma.opportunity.upsert({
      where: { generationKey: pattern.id },
      update: {},
      create: {
        generationKey: pattern.id,
        provenance,
        research: JSON.stringify(result),
        title: result.title,
        description: result.problem,
        industry: result.opportunity_type,
        score: score.overall,
        evidence: {
          create: supporting.map((s) => ({
            signalId: s.id,
            claim: s.title,
            evidenceType: "neutral",
            strength: s.strength,
            sourceUrl: s.rawItem.url,
          })),
        },
      },
    });
    return NextResponse.json({
      ...result,
      savedId: saved.id,
      score: saved.score,
      patternId: pattern.id,
      supporting_signals: supporting.length,
      source_count: score.sources,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Не удалось получить корректную гипотезу со ссылками на сигналы. Данные не записаны.",
      },
      { status: 502 },
    );
  }
}
