import { z } from "zod";
import {
  hashId,
  traceableUrl,
  uniqueSignals,
  type PipelineSignal,
} from "./traceability.ts";
const schema = z.object({
  version: z.literal(1),
  pattern: z.object({
    id: z.string(),
    clusterId: z.string(),
    signalIds: z.array(z.string()).min(2),
  }),
  signals: z
    .array(
      z.object({
        signalId: z.string(),
        rawItemId: z.string(),
        sourceId: z.string(),
        url: z.string(),
        quote: z.string().min(12),
        claim: z.string(),
      }),
    )
    .min(2),
});
export function readProvenance(value: string | null) {
  try {
    const p = schema.parse(JSON.parse(value || "null"));
    if (
      p.pattern.id !== hashId("pattern", p.pattern.signalIds) ||
      p.pattern.clusterId !== hashId("cluster", p.pattern.signalIds) ||
      p.signals.some((s) => !p.pattern.signalIds.includes(s.signalId))
    )
      return null;
    return p;
  } catch {
    return null;
  }
}
export function signalsFromProvenance<T extends PipelineSignal>(
  value: string | null,
  signals: T[],
): T[] {
  const p = readProvenance(value);
  if (!p) return [];
  return uniqueSignals(
    signals.filter((s) =>
      p.signals.some(
        (original) =>
          original.signalId === s.id &&
          original.rawItemId === s.rawItem.id &&
          original.sourceId === s.rawItem.sourceId &&
          traceableUrl(original.url) === traceableUrl(s.rawItem.url) &&
          original.quote === s.description &&
          original.claim === s.title,
      ),
    ),
  );
}
