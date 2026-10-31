// Embedding vectors of signal grouping phrases, stored in Signal.embedding as
// JSON {model, v}. Vectors from different models are never compared.
// Cosine thresholds differ between embedding models, so each is calibrated on
// the same task-only phrases (2026-10-22):
// - openai/text-embedding-3-small: same problem 0.52-0.74, different <= 0.43
// - nvidia/nemotron-3.5-embed-1b:free: same problem 0.49-0.68, different <= 0.26
// Uncalibrated models use the stricter default.
export const SEMANTIC_THRESHOLD = 0.5;
const CALIBRATED: Record<string, number> = {
  "openai/text-embedding-3-small": 0.5,
  "nvidia/nemotron-3.5-embed-1b:free": 0.4,
};
export function semanticThreshold(model: string): number {
  return Object.hasOwn(CALIBRATED, model) ? CALIBRATED[model] : SEMANTIC_THRESHOLD;
}
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
