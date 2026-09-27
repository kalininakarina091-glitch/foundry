import { traceableUrl } from "./source-url.ts";
import { z } from "zod";

const claimSchema = z.object({
  claim: z.string().min(1),
  evidence_ids: z.array(z.string()).min(1),
});
export const validationSchema = z.object({
  verdict: z.enum(["promising", "uncertain", "not_recommended"]),
  confidence: z.number().min(0).max(100),
  positive_evidence: z.array(claimSchema),
  negative_evidence: z.array(claimSchema),
  biggest_risk: z.string().min(1),
  why_not: z.string().min(1),
  what_would_change: z.string().min(1),
  recommendation: z.enum(["BUILD", "RESEARCH MORE", "SKIP"]),
  explanation: z.string().min(1),
});
export type ValidationReport = z.infer<typeof validationSchema>;
export interface ValidationEvidence {
  id: string;
  claim: string | null;
  sourceId: string;
  rawItemId: string;
  url: string | null;
  type: string;
  signalType: string;
}
export function evidenceStats(evidence: ValidationEvidence[]) {
  return {
    total: evidence.length,
    positive: evidence.filter((e) => e.type === "positive").length,
    negative: evidence.filter((e) => e.type === "negative").length,
    sources: new Set(evidence.map((e) => e.sourceId)).size,
  };
}
export function hasEnoughEvidence(evidence: ValidationEvidence[]) {
  const urls = new Set<string>();
  const traceable = evidence.filter((e) => {
    const url = traceableUrl(e.url);
    if (!e.claim?.trim() || !url || urls.has(url)) return false;
    urls.add(url);
    return true;
  });
  return (
    new Set(traceable.map((e) => e.rawItemId)).size >= 3 &&
    new Set(traceable.map((e) => e.sourceId)).size >= 2 &&
    new Set(traceable.map((e) => new URL(e.url!).hostname)).size >= 2
  );
}
export function insufficientReport(): ValidationReport {
  return {
    verdict: "uncertain",
    confidence: 0,
    positive_evidence: [],
    negative_evidence: [],
    biggest_risk:
      "Недостаточно независимых материалов для проверки спроса и ограничений.",
    why_not: "Высокая оценка возможности не подтверждает наличие рынка.",
    what_would_change:
      "Соберите как минимум три исходных материала с доступными ссылками из двух источников. Проверьте повторяемость проблемы и причины отказа от решения.",
    recommendation: "RESEARCH MORE",
    explanation:
      "Недостаточно данных. Сначала исследуйте проблему и альтернативные объяснения; решение о разработке пока преждевременно.",
  };
}

/** A product guardrail, not a statistical estimate of business success. */
export function checkValidationReport(
  value: unknown,
  evidence: ValidationEvidence[],
): ValidationReport {
  const report = validationSchema.parse(value);
  const ids = new Set(evidence.map((e) => e.id));
  for (const claim of [
    ...report.positive_evidence,
    ...report.negative_evidence,
  ]) {
    if (claim.evidence_ids.some((id) => !ids.has(id)))
      throw new Error("Unknown evidence reference");
  }
  if (!hasEnoughEvidence(evidence)) return insufficientReport();
  if (
    report.recommendation === "BUILD" &&
    (report.confidence < 70 ||
      report.verdict !== "promising" ||
      report.positive_evidence.length === 0 ||
      !hasEnoughEvidence(
        evidence.filter((e) =>
          report.positive_evidence.some((c) => c.evidence_ids.includes(e.id)),
        ),
      ))
  ) {
    return {
      ...report,
      verdict: "uncertain",
      recommendation: "RESEARCH MORE",
      explanation: "Оснований для BUILD недостаточно. " + report.explanation,
    };
  }
  return report;
}
