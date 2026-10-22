import { prisma } from "@/lib/db";
import { normalizeText, traceableUrl } from "@/lib/traceability";
import { quoteInSource } from "@/lib/source-text";
import { decodeEmbedding } from "@/lib/semantic";
import { embedTexts, EMBEDDING_MODEL } from "@/lib/embeddings";
import { failureOf } from "@/lib/ai-errors";
export async function normalizeAllSignals() {
  const signals = await prisma.signal.findMany({
    include: { rawItem: { include: { source: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const canonical = new Map<string, string>();
  let duplicates = 0;
  let excluded = 0;
  for (const s of signals) {
    // Clustering uses the English grouping phrase (embedded, or compared by
    // words as a fallback); the Russian title is for display. Older signals
    // fall back to their title.
    const problem = normalizeText(
      s.groupingKey || s.title || s.pain || s.description || "",
    );
    const url = traceableUrl(s.rawItem.url);
    // A material rechecked as "not a need" keeps its signal for provenance
    // but takes no part in clustering.
    const hasQuote =
      s.rawItem.extractionStatus !== "irrelevant" &&
      quoteInSource(s.description, s.rawItem);
    // The same problem in independent documents is corroboration, not a duplicate.
    const eligible = !!url && !!problem && hasQuote;
    const duplicateOf = eligible ? canonical.get(url) || null : null;
    if (eligible && !duplicateOf) canonical.set(url, s.id);
    else if (duplicateOf) duplicates++;
    if (!url || !problem || !hasQuote) excluded++;
    await prisma.signal.update({
      where: { id: s.id },
      data: {
        normalizedProblem: url && problem && hasQuote ? problem : null,
        normalizedCustomer: s.customer ? normalizeText(s.customer) : null,
        duplicateOf,
      },
    });
  }
  return {
    total: signals.length,
    normalized: signals.length - excluded,
    duplicates,
    excluded,
    ...(await embedMissing()),
  };
}
const EMBED_PER_RUN = 200;
/**
 * Embeds grouping phrases of clusterable signals that have no vector from
 * the current model. Failures leave vectors empty: clustering then falls
 * back to word overlap for those signals, normalization still succeeds.
 */
async function embedMissing() {
  if (!process.env.OPENROUTER_API_KEY) return { embedded: 0 };
  const candidates = await prisma.signal.findMany({
    where: { duplicateOf: null, normalizedProblem: { not: null } },
    select: { id: true, groupingKey: true, title: true, embedding: true },
    orderBy: { id: "asc" },
  });
  const missing = candidates
    .filter((s) => decodeEmbedding(s.embedding)?.model !== EMBEDDING_MODEL)
    .slice(0, EMBED_PER_RUN);
  if (!missing.length) return { embedded: 0 };
  try {
    const vectors = await embedTexts(
      missing.map((s) => (s.groupingKey || s.title || "").slice(0, 500)),
    );
    await prisma.$transaction(
      missing.map((s, i) =>
        prisma.signal.update({
          where: { id: s.id },
          data: { embedding: vectors[i] },
        }),
      ),
    );
    return { embedded: missing.length };
  } catch (e) {
    const { reason } = failureOf(e);
    console.error(`[normalize] embedding failed reason=${reason}`);
    return { embedded: 0, embeddingError: reason };
  }
}
