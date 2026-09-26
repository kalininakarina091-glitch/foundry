import { scoreOpportunity } from "@/lib/scoring";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOpportunityFromCluster } from "@/lib/opportunity-generator";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const clusterName = body?.clusterName;
  if (typeof clusterName !== "string" || !clusterName.trim())
    return NextResponse.json({ error: "Укажите паттерн." }, { status: 400 });

  // Определяем ключевые слова для поиска
  let keywords: string[] = [];

  if (
    clusterName.includes("smb") ||
    clusterName.includes("compliance") ||
    clusterName.includes("regulatory")
  ) {
    keywords = ["compliance", "regulatory", "smb", "small business"];
  } else if (
    clusterName.includes("freelancer") ||
    clusterName.includes("profitability")
  ) {
    keywords = ["freelancer", "profitability", "project"];
  } else if (
    clusterName.includes("microsaas") ||
    clusterName.includes("micro-saas") ||
    clusterName.includes("research")
  ) {
    keywords = [
      "microsaas",
      "micro-saas",
      "customer research",
      "validate",
      "validation",
    ];
  } else {
    keywords = [clusterName];
  }

  // Получаем ВСЕ сигналы
  const allSignals = await prisma.signal.findMany({
    where: { duplicateOf: null },
    include: {
      rawItem: {
        include: { source: true },
      },
    },
  });

  // Фильтруем по ключевым словам
  const signals = allSignals.filter((signal) => {
    const text =
      `${signal.normalizedProblem || ""} ${signal.title || ""} ${signal.description || ""}`.toLowerCase();
    return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  });

  if (signals.length < 2) {
    return NextResponse.json(
      {
        error: `Недостаточно сигналов для создания opportunity (найдено: ${signals.length})`,
      },
      { status: 400 },
    );
  }

  try {
    const opportunity = await generateOpportunityFromCluster(
      clusterName,
      signals,
    );

    const saved = await prisma.opportunity.create({
      data: {
        title: opportunity.title,
        description: opportunity.problem,
        industry: opportunity.opportunity_type,
        score: 0,
        evidence: {
          create: signals.map((signal) => ({
            signalId: signal.id,
            claim: signal.title || signal.description,
            evidenceType: "neutral",
            strength: signal.strength,
            sourceUrl: signal.rawItem.url,
          })),
        },
      },
    });

    const score = await scoreOpportunity(saved.id);
    await prisma.opportunity.update({
      where: { id: saved.id },
      data: { score: score.overall },
    });
    return NextResponse.json({
      ...opportunity,
      score: score.overall,
      savedId: saved.id,
    });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Ошибка генерации opportunity" },
      { status: 500 },
    );
  }
}
