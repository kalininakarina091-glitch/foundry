import { readProvenance, signalsFromProvenance } from "@/lib/provenance";
import { traceableUrl } from "@/lib/traceability";
import { scoreSignals } from "@/lib/scoring";
import { prisma } from "@/lib/db";
import { mockOpportunities } from "@/lib/mock-data";
import type { OpportunityView } from "@/lib/opportunity-types";

const evidenceInclude = {
  signal: { include: { rawItem: { include: { source: true } } } },
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
    include: { evidence: { include: evidenceInclude } },
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
  let research: Record<string, string | null> = {};
  try {
    const value = JSON.parse(item.research || "{}");
    if (value && typeof value === "object" && !Array.isArray(value))
      research = value;
  } catch {}
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
  const customers = [
    ...new Set(evidence.map((e) => e.signal.customer).filter(Boolean)),
  ];
  const categories: Record<string, string> = { saas: "SaaS", ai: "AI" };
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    industry: item.industry
      ? categories[item.industry.toLowerCase()] || item.industry
      : null,
    score: scoreSignals(evidence.map((e) => e.signal)).overall,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    demo: false,
    problem: item.description,
    customer: research.target_customer || customers.join(" · ") || null,
    whyNow: research.why_now || null,
    market: research.market_gap || null,
    competition: null,
    monetization: null,
    risks: [],
    mvp: null,
    origin,
    excludedEvidence: item.evidence.length - evidence.length,
    evidence: evidence.map((e) => ({
      id: e.id,
      claim: e.claim,
      type: e.evidenceType,
      strength: e.strength,
      signalId: e.signal.id,
      signalType: e.signal.type,
      signalTitle: e.signal.title,
      source: e.signal.rawItem.source.name,
      sourceId: e.signal.rawItem.sourceId,
      rawItemId: e.signal.rawItemId,
      url: traceableUrl(e.signal.rawItem.url),
      quote: e.signal.description,
      sourceText: (
        e.signal.rawItem.content ||
        e.signal.rawItem.title ||
        ""
      ).slice(0, 4000),
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
    include: { evidence: { include: evidenceInclude } },
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
