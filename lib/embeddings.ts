import { AIError } from "@/lib/ai-errors";
import { encodeEmbedding } from "@/lib/semantic";
export const EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";
const MAX_BATCH = 64;
/** Encoded embeddings for the texts, in order. Throws AIError on failure. */
export async function embedTexts(texts: string[]): Promise<string[]> {
  if (!process.env.OPENROUTER_API_KEY)
    throw new AIError("provider_not_configured");
  const out: string[] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const input = texts.slice(i, i + MAX_BATCH);
    let response: Response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input }),
      });
    } catch (e) {
      throw new AIError(
        e instanceof Error && e.name === "TimeoutError"
          ? "provider_timeout"
          : "provider_unavailable",
      );
    }
    if (!response.ok) throw new AIError("provider_http", response.status);
    const data = await response.json().catch(() => null);
    const rows: unknown = data?.data;
    if (!Array.isArray(rows) || rows.length !== input.length)
      throw new AIError("invalid_response");
    for (const row of [...rows].sort((a, b) => a.index - b.index)) {
      const v = row?.embedding;
      if (!Array.isArray(v) || !v.every((x) => typeof x === "number"))
        throw new AIError("invalid_response");
      out.push(encodeEmbedding(EMBEDDING_MODEL, v));
    }
  }
  return out;
}
