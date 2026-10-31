import { readProvenance, signalsFromProvenance } from "@/lib/provenance";
import { traceableUrl } from "@/lib/traceability";
import { sourceDocument } from "@/lib/source-text";
import { evidenceStance } from "@/lib/validation";
import { productTypeLabel } from "@/lib/labels";
import { materialKindOf, scoreOpportunity } from "@/lib/opportunity-score";
import { scoreSignals } from "@/lib/scoring";
import { prisma } from "@/lib/db";
import { mockOpportunities } from "@/lib/mock-data";
import type { OpportunityView } from "@/lib/opportunity-types";

const opportunityInclude = {
  evidence: {
    include: {
      signal: { include: { rawItem: { include: { source: true } } } },
    },
  },
  validations: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      confidence: true,
      recommendation: true,
      createdAt: true,
      report: true,
    },
  },
} as const;
function demoOpportunity(
  item: (typeof mockOpportunities)[number],
): OpportunityView {
  return {
    id: item.id,
    title: item.title,
    description: item.summary,
    industry: item.industry,
    score: item.score,
    status: "demo",
    createdAt: null,
    demo: true,
    evidence: [],
    problem: item.problem,
    customer: item.customer,
    whyNow: item.whyNow,
    market: item.marketGap,
    competition: item.competition,
    monetization: item.businessModel,
    risks: item.risks,
    mvp: item.mvp,
  };
}
function findDatabaseOpportunity(id: string) {
  return prisma.opportunity.findUnique({
    where: { id },
    include: opportunityInclude,
  });
}
type DatabaseOpportunity = NonNullable<
  Awaited<ReturnType<typeof findDatabaseOpportunity>>
>;
function databaseOpportunity(item: DatabaseOpportunity): OpportunityView {
  const validIds = new Set(
    signalsFromProvenance(
      item.provenance,
      item.evidence.map((e) => e.signal),
    ).map((s) => s.id),
  );
  const seen = new Set<string>();
  const evidence = item.evidence.filter((e) => {
    const url = traceableUrl(e.signal.rawItem.url);
    if (!url || !validIds.has(e.signal.id) || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
  let research: Record<string, unknown> = {};
  try {
    const value = JSON.parse(item.research || "{}");
    if (value && typeof value === "object" && !Array.isArray(value))
      research = value;
  } catch {}
  const text = (key: string) =>
    typeof research[key] === "string" ? (research[key] as string) : null;
  const evidenceSignals = evidence.map((e) => e.signal);
  // Older hypotheses were generated before monetization was assessed: null.
  const monetizationIds = Array.isArray(research.monetization_signal_ids)
    ? research.monetization_signal_ids.filter((x): x is string => typeof x === "string")
    : null;
  const scoreBreakdown = scoreOpportunity({
    signals: evidenceSignals.map((s) => ({
      id: s.id,
      strength: s.strength,
      materialKind: materialKindOf(s.rawItem.metadata),
      publishedAt: s.rawItem.publishedAt,
    })),
    evidence: scoreSignals(evidenceSignals),
    monetizationSignalIds: monetizationIds,
  });
  const alternatives = Array.isArray(research.alternatives_mentioned)
    ? [
        ...new Set(
          research.alternatives_mentioned
            .map((a) => (a && typeof a.name === "string" ? a.name : null))
            .filter((n): n is string => !!n),
        ),
      ]
    : [];
  let origin: OpportunityView["origin"];
  try {
    const p = readProvenance(item.provenance);
    if (!p) throw new Error("Missing provenance");
    origin = {
      patternId: p.pattern.id,
      clusterId: p.pattern.clusterId,
      signalIds: p.signals.map((s: { signalId: string }) => s.signalId),
    };
  } catch {}
  // Stored evidence is neutral; the latest saved validation states which
  // items it cited for or against the hypothesis.
  const stance = evidenceStance(item.validations[0]?.report);
  const stanceCheckedAt = item.validations[0]?.createdAt.toISOString();
  const customers = [
    ...new Set(evidence.map((e) => e.signal.customer).filter(Boolean)),
  ];

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    industry: item.industry
      ? productTypeLabel(item.industry)
      : null,
    score: scoreBreakdown.overall,
    scoreBreakdown,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    demo: false,
    problem: item.description,
    customer: text("target_customer") || customers.join(" · ") || null,
    whyNow: text("why_now"),
    market: text("market_gap"),
    competition: alternatives.length
      ? `Названы в источниках: ${alternatives.join(", ")}. Это не полный обзор конкурентов.`
      : null,
    monetization: null,
    risks: [],
    mvp: null,
    origin,
    excludedEvidence: item.evidence.length - evidence.length,
    validation: item.validations[0]
      ? {
          confidence: item.validations[0].confidence,
          recommendation: item.validations[0].recommendation,
          checkedAt: item.validations[0].createdAt.toISOString(),
        }
      : null,
    evidence: evidence.map((e) => ({
      id: e.id,
      claim: e.claim,
      type: e.evidenceType,
      ...(stance.has(e.id)
        ? { stance: stance.get(e.id), stanceCheckedAt: stanceCheckedAt! }
        : {}),
      strength: e.strength,
      signalId: e.signal.id,
      signalType: e.signal.type,
      signalTitle: e.signal.title,
      source: e.signal.rawItem.source.name,
      sourceId: e.signal.rawItem.sourceId,
      rawItemId: e.signal.rawItemId,
      url: traceableUrl(e.signal.rawItem.url),
      quote: e.signal.description,
      sourceText: sourceDocument({
        content: e.signal.rawItem.content || e.signal.rawItem.title,
        source: e.signal.rawItem.source,
      }).slice(0, 4000),
      date: (
        e.signal.rawItem.publishedAt || e.signal.rawItem.fetchedAt
      ).toISOString(),
      dateKind: e.signal.rawItem.publishedAt ? "published" : "captured",
    })),
  };
}
export async function listOpportunities(
  demo = false,
): Promise<OpportunityView[]> {
  if (demo) return mockOpportunities.map(demoOpportunity);
  const items = await prisma.opportunity.findMany({
    orderBy: { createdAt: "desc" },
    include: opportunityInclude,
  });
  return items.map(databaseOpportunity);
}
export async function getOpportunity(
  id: string,
  demo = false,
): Promise<OpportunityView | null> {
  if (demo) {
    const item = mockOpportunities.find((o) => o.id === id);
    return item ? demoOpportunity(item) : null;
  }
  const item = await findDatabaseOpportunity(id);
  return item ? databaseOpportunity(item) : null;
}
