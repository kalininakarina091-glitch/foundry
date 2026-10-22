import { traceableUrl } from "./source-url.ts";
import { quoteInSource } from "./source-text.ts";
import {
  cosine,
  decodeEmbedding,
  LEXICAL_THRESHOLD,
  SEMANTIC_THRESHOLD,
} from "./semantic.ts";
export { traceableUrl } from "./source-url.ts";
import { createHash } from "node:crypto";
export function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function hashId(prefix: string, values: string[]): string {
  return `${prefix}-${createHash("sha256")
    .update(JSON.stringify([...values].sort()))
    .digest("hex")
    .slice(0, 24)}`;
}
export function similarity(a: string, b: string): number {
  const wordsA = new Set(
    normalizeText(a)
      .split(" ")
      .filter((w) => w.length > 3),
  );
  const wordsB = new Set(
    normalizeText(b)
      .split(" ")
      .filter((w) => w.length > 3),
  );
  const shared = [...wordsA].filter((w) => wordsB.has(w)).length;
  if (shared < 2) return 0;
  return shared / new Set([...wordsA, ...wordsB]).size;
}
export interface PipelineSignal {
  id: string;
  title: string | null;
  description: string | null;
  normalizedProblem: string | null;
  customer: string | null;
  industry: string | null;
  type: string;
  strength: number;
  createdAt: Date;
  duplicateOf: string | null;
  embedding?: string | null;
  rawItem: {
    id: string;
    url: string | null;
    content: string | null;
    title?: string | null;
    sourceId: string;
    publishedAt: Date | null;
    source: { id: string; name: string; type: string };
  };
}
export function isTraceableSignal(signal: PipelineSignal): boolean {
  return (
    !!traceableUrl(signal.rawItem.url) &&
    !signal.duplicateOf &&
    quoteInSource(signal.description, signal.rawItem)
  );
}
export function uniqueSignals<T extends PipelineSignal>(signals: T[]): T[] {
  const urls = new Set<string>();
  const rawIds = new Set<string>();
  return signals.filter((s) => {
    const url = traceableUrl(s.rawItem.url);
    if (
      !url ||
      !isTraceableSignal(s) ||
      urls.has(url) ||
      rawIds.has(s.rawItem.id)
    )
      return false;
    urls.add(url);
    rawIds.add(s.rawItem.id);
    return true;
  });
}
export function groupSignals<T extends PipelineSignal>(input: T[]) {
  const signals = uniqueSignals(
    [...input].sort((a, b) => a.id.localeCompare(b.id)),
  )
    .filter((s) => s.normalizedProblem)
    .sort((a, b) => a.id.localeCompare(b.id));
  const groups: T[][] = [];
  for (const signal of signals) {
    // Complete link: a signal joins only if it matches every member.
    const group = groups.find((g) =>
      g.every((member) => pairMatch(member, signal).linked),
    );
    if (group) group.push(signal);
    else groups.push([signal]);
  }
  return groups
    .filter((g) => g.length >= 2)
    .map((members) => {
      const pairs = members.flatMap((a, i) =>
        members.slice(i + 1).map((b) => pairMatch(a, b)),
      );
      const methods = new Set(pairs.map((p) => p.method));
      return {
        id: hashId(
          "cluster",
          members.map((s) => s.id),
        ),
        members,
        method:
          methods.size > 1
            ? ("mixed" as const)
            : (pairs[0].method as "semantic" | "lexical"),
        cohesion: Math.min(...pairs.map((p) => p.score)),
      };
    });
}
/** Semantic when both signals carry embeddings of one model, else lexical. */
export function pairMatch(a: PipelineSignal, b: PipelineSignal) {
  const ea = decodeEmbedding(a.embedding),
    eb = decodeEmbedding(b.embedding);
  if (ea && eb && ea.model === eb.model) {
    const score = cosine(ea.v, eb.v);
    return { method: "semantic" as const, score, linked: score >= SEMANTIC_THRESHOLD };
  }
  const score = similarity(a.normalizedProblem || "", b.normalizedProblem || "");
  return { method: "lexical" as const, score, linked: score >= LEXICAL_THRESHOLD };
}
