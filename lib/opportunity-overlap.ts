import { readProvenance } from "./provenance.ts";
export interface PatternOverlap {
  opportunityId: string;
  title: string;
  shared: number;
  /** Pattern signals the opportunity does not yet contain. */
  newSignalIds: string[];
  /** The pattern contains every signal of the opportunity's own pattern. */
  extendable: boolean;
}
/**
 * Opportunities whose traced pattern shares signals with this pattern. Pattern
 * IDs hash their members, so a grown cluster gets a new ID; this keeps one
 * opportunity per problem instead of generating a duplicate.
 */
export function findPatternOverlaps(
  patternSignalIds: string[],
  opportunities: { id: string; title: string; provenance: string | null }[],
): PatternOverlap[] {
  const members = new Set(patternSignalIds);
  const overlaps: PatternOverlap[] = [];
  for (const o of opportunities) {
    const own = readProvenance(o.provenance)?.pattern.signalIds;
    if (!own) continue;
    const shared = own.filter((id) => members.has(id)).length;
    if (!shared) continue;
    const ownSet = new Set(own);
    const newSignalIds = patternSignalIds.filter((id) => !ownSet.has(id));
    overlaps.push({
      opportunityId: o.id,
      title: o.title,
      shared,
      newSignalIds,
      extendable: shared === own.length && newSignalIds.length > 0,
    });
  }
  return overlaps.sort(
    (a, b) => b.shared - a.shared || a.opportunityId.localeCompare(b.opportunityId),
  );
}
