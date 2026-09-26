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
  const customers = [
    ...new Set(item.evidence.map((e) => e.signal.customer).filter(Boolean)),
  ];
  const categories: Record<string, string> = { saas: "SaaS", ai: "AI" };
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    industry: item.industry
      ? categories[item.industry.toLowerCase()] || item.industry
      : null,
    score: item.score,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    demo: false,
    problem: item.description,
    customer: customers.join(" · ") || null,
    whyNow: null,
    market: null,
    competition: null,
    monetization: null,
    risks: [],
    mvp: null,
    evidence: item.evidence.map((e) => ({
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
      url: e.sourceUrl || e.signal.rawItem.url,
      date: (e.signal.rawItem.publishedAt || e.createdAt).toISOString(),
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
