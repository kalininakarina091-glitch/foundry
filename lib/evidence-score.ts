import { uniqueSignals, type PipelineSignal } from "./traceability.ts";
export function scoreSignals(signals: PipelineSignal[]) {
  const unique = uniqueSignals(signals);
  const sourceCount = new Set(
    unique.map((s) => new URL(s.rawItem.url!).hostname),
  ).size;
  const support = Math.min(unique.length / 10, 1);
  const diversity = Math.min(sourceCount / 3, 1);
  const strength = unique.length
    ? unique.reduce((a, s) => a + Math.max(0, Math.min(1, s.strength)), 0) /
      unique.length
    : 0;
  return {
    overall: unique.length
      ? Math.round(100 * (support * 0.4 + diversity * 0.3 + strength * 0.3))
      : 0,
    materials: unique.length,
    sources: sourceCount,
    sourceRecords: new Set(unique.map((s) => s.rawItem.sourceId)).size,
    averageStrength: strength,
    method: "evidence-support-v1",
    limitations:
      "Heuristic evidence support using distinct publication hosts, not proven independent witnesses; growth, market size, monetization, competition and risk are not measured.",
  };
}
