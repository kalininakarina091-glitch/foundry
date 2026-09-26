import { prisma } from "@/lib/db";

export interface Pattern {
  clusterName: string;
  patterns: string[];
  strength: number;
  shouldCreateOpportunity: boolean;
}

export async function detectPatterns(): Promise<Pattern[]> {
  const signals = await prisma.signal.findMany({
    where: { duplicateOf: null },
    include: {
      rawItem: {
        include: { source: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const groups = new Map<string, typeof signals>();

  function getGroupKey(text: string): string {
    const keywords = [
      "freelancer",
      "smb",
      "small business",
      "microsaas",
      "micro-saas",
      "compliance",
      "regulatory",
      "profitability",
      "customer research",
    ];
    const lower = text.toLowerCase();

    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return keyword;
      }
    }

    return lower.slice(0, 50);
  }

  for (const signal of signals) {
    const key = getGroupKey(signal.normalizedProblem || signal.title || "");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(signal);
  }

  const mergedGroups = new Map<string, typeof signals>();

  for (const [key, groupSignals] of groups) {
    const mainKey =
      key.includes("smb") ||
      key.includes("small business") ||
      key.includes("compliance") ||
      key.includes("regulatory")
        ? "smb-compliance"
        : key.includes("freelancer") || key.includes("profitability")
          ? "freelancer-profitability"
          : key.includes("microsaas") ||
              key.includes("micro-saas") ||
              key.includes("customer research")
            ? "microsaas-research"
            : key;

    if (!mergedGroups.has(mainKey)) mergedGroups.set(mainKey, []);
    mergedGroups.get(mainKey)!.push(...groupSignals);
  }

  const patterns: Pattern[] = [];

  for (const [problem, groupSignals] of mergedGroups) {
    if (groupSignals.length < 2) continue;

    const detected: string[] = [];
    let score = 0;

    if (groupSignals.length >= 3) {
      detected.push("repeated_pain");
      score += 20;
    }

    const sources = new Set(groupSignals.map((s) => s.rawItem.source.name));
    if (sources.size >= 2) {
      detected.push("cross_source_confirmation");
      score += 25;
    }

    const recent = groupSignals.filter(
      (s) => Date.now() - s.createdAt.getTime() < 48 * 60 * 60 * 1000,
    );
    if (recent.length >= 2) {
      detected.push("growing_pain");
      score += 15;
    }

    const complaints = groupSignals.filter((s) => s.type === "complaint");
    if (complaints.length >= 1) {
      detected.push("market_gap");
      score += 20;
    }

    const regulatory = groupSignals.filter((s) => s.type === "regulatory");
    if (regulatory.length >= 1) {
      detected.push("regulatory_trigger");
      score += 20;
    }

    const demand = groupSignals.filter((s) => s.type === "demand");
    if (demand.length >= 1) {
      detected.push("emerging_demand");
      score += 15;
    }

    patterns.push({
      clusterName: problem,
      patterns: detected,
      strength: Math.min(score, 100),
      shouldCreateOpportunity: score >= 50,
    });
  }

  return patterns.sort((a, b) => b.strength - a.strength);
}
