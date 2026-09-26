import { prisma } from "@/lib/db";

export interface ScoreComponents {
  demand: number;
  pain: number;
  growth: number;
  monetization: number;
  marketGap: number;
  competition: number;
  complexity: number;
  risk: number;
  overall: number;
}

export async function scoreOpportunity(
  opportunityId: string,
): Promise<ScoreComponents> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: {
      evidence: {
        include: {
          signal: true,
        },
      },
    },
  });

  if (!opportunity) {
    throw new Error("Opportunity не найдена");
  }

  const signals = opportunity.evidence.map((e) => e.signal);
  const evidence = opportunity.evidence;

  // Demand: количество сигналов
  const demand = Math.min(signals.length * 8, 100);

  // Pain: средняя strength
  const pain = Math.round(
    (signals.reduce((a, s) => a + s.strength, 0) /
      Math.max(signals.length, 1)) *
      100,
  );

  // Growth: сигналы за последние 48 часов
  const recentSignals = signals.filter(
    (s) => Date.now() - s.createdAt.getTime() < 48 * 60 * 60 * 1000,
  );
  const growth = Math.min(recentSignals.length * 15, 100);

  // Monetization: evidence с demand/complaint типами
  const monetizationEvidence = evidence.filter(
    (e) => e.signal.type === "demand" || e.signal.type === "complaint",
  );
  const monetization = Math.min(monetizationEvidence.length * 20, 100);

  // Market Gap: complaint сигналы
  const gapSignals = evidence.filter(
    (e) => e.signal.type === "complaint" || e.signal.type === "market_gap",
  );
  const marketGap = Math.min(gapSignals.length * 25, 100);

  // Competition: regulatory сложность
  const regulatorySignals = evidence.filter(
    (e) => e.signal.type === "regulatory",
  );
  const competition = Math.min(50 + regulatorySignals.length * 10, 100);

  // Complexity: обратная зависимость от типа
  const complexity = 50;

  // Risk: regulatory + complaint
  const risk = Math.min(30 + regulatorySignals.length * 15, 100);

  const overall = Math.round(
    demand * 0.2 +
      pain * 0.25 +
      growth * 0.1 +
      monetization * 0.15 +
      marketGap * 0.15 +
      (100 - competition) * 0.05 +
      (100 - complexity) * 0.05 +
      (100 - risk) * 0.05,
  );

  return {
    demand,
    pain,
    growth,
    monetization,
    marketGap,
    competition,
    complexity,
    risk,
    overall,
  };
}
