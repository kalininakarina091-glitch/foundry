import { prisma } from "@/lib/db";
import { validationSchema, type ValidationReport } from "@/lib/validation";
import type { EvidenceView } from "@/lib/opportunity-types";
export interface StoredValidation {
  id: string;
  report: ValidationReport;
  evidenceSnapshot: EvidenceView[];
  availableEvidence: number;
  model: string;
  checkedAt: string;
}
export interface ValidationSummary {
  id: string;
  recommendation: string;
  confidence: number;
  checkedAt: string;
}
export async function saveValidationRun(input: {
  opportunityId: string;
  userId: string;
  model: string;
  report: ValidationReport;
  evidenceSnapshot: EvidenceView[];
  evidenceStats: unknown;
  availableEvidence: number;
}) {
  const [run] = await prisma.$transaction([
    prisma.validationRun.create({
      data: {
        opportunityId: input.opportunityId,
        userId: input.userId,
        model: input.model,
        verdict: input.report.verdict,
        recommendation: input.report.recommendation,
        confidence: Math.round(input.report.confidence),
        report: JSON.stringify(input.report),
        evidenceSnapshot: JSON.stringify(input.evidenceSnapshot),
        evidenceStats: JSON.stringify(input.evidenceStats),
        availableEvidence: input.availableEvidence,
      },
    }),
    // The shared catalog status only moves forward from "new".
    prisma.opportunity.updateMany({
      where: { id: input.opportunityId, status: "new" },
      data: { status: "validated" },
    }),
  ]);
  return run;
}
function parseRun(run: {
  id: string;
  report: string;
  evidenceSnapshot: string;
  availableEvidence: number;
  model: string;
  createdAt: Date;
}): StoredValidation | null {
  try {
    const report = validationSchema.safeParse(JSON.parse(run.report));
    const snapshot = JSON.parse(run.evidenceSnapshot);
    if (!report.success || !Array.isArray(snapshot)) return null;
    return {
      id: run.id,
      report: report.data,
      evidenceSnapshot: snapshot,
      availableEvidence: run.availableEvidence,
      model: run.model,
      checkedAt: run.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}
/** A specific run of this opportunity, or its latest run. */
export async function getValidationRun(opportunityId: string, runId?: string) {
  const run = await prisma.validationRun.findFirst({
    where: { opportunityId, ...(runId ? { id: runId } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return run ? parseRun(run) : null;
}
export async function listValidationRuns(
  opportunityId: string,
  take = 20,
): Promise<ValidationSummary[]> {
  const runs = await prisma.validationRun.findMany({
    where: { opportunityId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, recommendation: true, confidence: true, createdAt: true },
  });
  return runs.map((r) => ({
    id: r.id,
    recommendation: r.recommendation,
    confidence: r.confidence,
    checkedAt: r.createdAt.toISOString(),
  }));
}
