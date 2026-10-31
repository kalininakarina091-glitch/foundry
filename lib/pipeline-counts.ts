import { prisma } from "@/lib/db";
import { EMBEDDING_MODEL } from "@/lib/embeddings";
import type { PipelineCounts } from "@/lib/pipeline-health";
/** Counters for the pipeline status panel and the dashboard admin hint. */
export async function pipelineCounts() {
  const clusterable = { duplicateOf: null, normalizedProblem: { not: null } } as const;
  const [activeSources, statuses, signals, normalizedSignals, clusterableSignals, embeddedSignals, lastSync, lastExtract, opportunities] =
    await Promise.all([
      prisma.source.count({ where: { status: "active" } }),
      prisma.rawItem.groupBy({ by: ["extractionStatus"], _count: true }),
      prisma.signal.count(),
      prisma.signal.count({ where: { normalizedProblem: { not: null } } }),
      prisma.signal.count({ where: clusterable }),
      prisma.signal.count({
        where: { ...clusterable, embedding: { contains: `"model":${JSON.stringify(EMBEDDING_MODEL)}` } },
      }),
      prisma.source.aggregate({ _max: { lastSyncedAt: true } }),
      prisma.rawItem.aggregate({ _max: { extractedAt: true } }),
      prisma.opportunity.count({ where: { provenance: { not: null } } }),
    ]);
  const byStatus = (s: string) => statuses.find((x) => x.extractionStatus === s)?._count ?? 0;
  const counts: PipelineCounts = {
    activeSources,
    pending: byStatus("pending"),
    failed: byStatus("failed"),
    signals,
    normalizedSignals,
    clusterableSignals,
    embeddedSignals,
    aiConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    lastSyncAt: lastSync._max.lastSyncedAt,
    lastExtractAt: lastExtract._max.extractedAt,
  };
  return { counts, byStatus, opportunities };
}
