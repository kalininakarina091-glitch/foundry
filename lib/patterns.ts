import { clusterSignals } from "@/lib/cluster";
export async function detectPatterns() {
  return (await clusterSignals())
    .map((c) => {
      const patterns = ["repeated_observation"];
      if (c.sourceCount >= 2) patterns.push("multiple_source_records");
      if (c.signalTypes.includes("complaint"))
        patterns.push("reported_complaint");
      if (c.signalTypes.includes("demand")) patterns.push("reported_demand");
      const strength = Math.min(100, c.signalCount * 10 + c.sourceCount * 15);
      return {
        id: c.id.replace("cluster-", "pattern-"),
        clusterId: c.id,
        clusterName: c.name,
        signalIds: c.signalIds,
        rawItemIds: c.rawItemIds,
        sourceIds: c.sourceIds,
        patterns,
        strength,
        shouldCreateOpportunity: c.signalCount >= 2,
        method: "lexical-complete-link-v1",
      };
    })
    .sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
}
