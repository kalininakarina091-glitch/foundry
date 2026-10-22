// Embedding vectors of signal grouping phrases, stored in Signal.embedding as
// JSON {model, v}. Vectors from different models are never compared.
// Calibrated on 2026-10-22 with openai/text-embedding-3-small and task-only
// phrases: same problem 0.52-0.74, different problems <= 0.43.
export const SEMANTIC_THRESHOLD = 0.5;
export const LEXICAL_THRESHOLD = 0.28;
export interface StoredEmbedding {
  model: string;
  v: number[];
}
export function encodeEmbedding(model: string, vector: number[]): string {
  return JSON.stringify({
    model,
    v: vector.map((x) => Math.round(x * 1e6) / 1e6),
  });
}
export function decodeEmbedding(
  value: string | null | undefined,
): StoredEmbedding | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (
      typeof parsed?.model === "string" &&
      Array.isArray(parsed.v) &&
      parsed.v.length > 0 &&
      parsed.v.every((x: unknown) => typeof x === "number" && Number.isFinite(x))
    )
      return { model: parsed.model, v: parsed.v };
  } catch {}
  return null;
}
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || !a.length) return 0;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
