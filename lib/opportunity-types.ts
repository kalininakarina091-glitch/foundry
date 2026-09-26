export interface EvidenceView {
  id: string;
  claim: string | null;
  type: string;
  strength: number;
  signalId: string;
  signalType: string;
  signalTitle: string | null;
  source: string;
  sourceId: string;
  rawItemId: string;
  url: string | null;
  date: string;
}
export interface OpportunityView {
  id: string;
  title: string;
  description: string | null;
  industry: string | null;
  score: number;
  status: string;
  createdAt: string | null;
  demo: boolean;
  evidence: EvidenceView[];
  problem: string | null;
  customer: string | null;
  whyNow: string | null;
  market: string | null;
  competition: string | null;
  monetization: string | null;
  risks: string[];
  mvp: string | null;
}
export function opportunityHref(item: Pick<OpportunityView, "id" | "demo">) {
  return `/opportunities/${encodeURIComponent(item.id)}${item.demo ? "?mode=demo" : ""}`;
}
export function safeSourceUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
