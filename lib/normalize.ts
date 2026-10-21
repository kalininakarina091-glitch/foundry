import { prisma } from "@/lib/db";
import { normalizeText, traceableUrl } from "@/lib/traceability";
import { quoteInSource } from "@/lib/source-text";
export async function normalizeAllSignals() {
  const signals = await prisma.signal.findMany({
    include: { rawItem: { include: { source: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const canonical = new Map<string, string>();
  let duplicates = 0;
  let excluded = 0;
  for (const s of signals) {
    const problem = normalizeText(s.title || s.pain || s.description || "");
    const url = traceableUrl(s.rawItem.url);
    const hasQuote = quoteInSource(s.description, s.rawItem);
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
  };
}
