import { prisma } from "@/lib/db";
import { groupSignals } from "@/lib/traceability";
export async function clusterSignals() {
  const signals = await prisma.signal.findMany({
    where: { duplicateOf: null, normalizedProblem: { not: null } },
    include: { rawItem: { include: { source: true } } },
    orderBy: { id: "asc" },
  });
  return groupSignals(signals).map(({ id, members }) => {
    const dates = members
      .map((s) => s.rawItem.publishedAt)
      .filter((d): d is Date => Boolean(d));
    return {
      id,
      name: members[0].title || members[0].normalizedProblem!,
      problem: members[0].normalizedProblem!,
      customer: members[0].customer,
      signalIds: members.map((s) => s.id),
      rawItemIds: members.map((s) => s.rawItemId),
      sourceIds: [...new Set(members.map((s) => s.rawItem.sourceId))],
      signalCount: members.length,
      sourceCount: new Set(members.map((s) => s.rawItem.sourceId)).size,
      firstDetected: dates.length
        ? new Date(Math.min(...dates.map((d) => d.getTime())))
        : null,
      latestDetected: dates.length
        ? new Date(Math.max(...dates.map((d) => d.getTime())))
        : null,
      signalTypes: [...new Set(members.map((s) => s.type))],
      industries: [
        ...new Set(
          members.map((s) => s.industry).filter((s): s is string => !!s),
        ),
      ],
      averageStrength:
        members.reduce((a, s) => a + s.strength, 0) / members.length,
    };
  });
}
