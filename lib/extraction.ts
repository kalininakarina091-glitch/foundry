import { prisma } from "@/lib/db";
import { extractSignals, AI_MODEL } from "@/lib/ai";
import {
  failureLabel,
  failureOf,
  MAX_EXTRACTION_ATTEMPTS,
} from "@/lib/ai-errors";
import { traceableUrl } from "@/lib/traceability";
export { MAX_EXTRACTION_ATTEMPTS } from "@/lib/ai-errors";
export function readMetadata(value: string | null): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      return parsed;
  } catch {}
  return {};
}
export function extractionAttempts(metadata: Record<string, unknown>): number {
  const extraction = metadata.extraction as { attempts?: unknown } | undefined;
  return typeof extraction?.attempts === "number" ? extraction.attempts : 0;
}
export async function extractRawItem(id: string) {
  const raw = await prisma.rawItem.findUnique({
    where: { id },
    include: { source: true },
  });
  if (!raw) return { status: 404, error: "Материал не найден" };
  if (!traceableUrl(raw.url)) {
    await prisma.rawItem.update({
      where: { id },
      data: { extractionStatus: "excluded" },
    });
    return {
      status: 200,
      skipped: true,
      reason: "Источник отсутствует или является демонстрационным",
    };
  }
  const existing = await prisma.signal.findFirst({ where: { rawItemId: id } });
  if (existing || raw.extractionStatus === "irrelevant")
    return {
      status: 200,
      skipped: true,
      signalId: existing?.id,
      reason: "Уже обработано",
    };
  const metadata = readMetadata(raw.metadata);
  const attempts = extractionAttempts(metadata) + 1;
  if (attempts > MAX_EXTRACTION_ATTEMPTS)
    return {
      status: 409,
      error: `Исчерпан лимит попыток извлечения (${MAX_EXTRACTION_ATTEMPTS})`,
    };
  const lock = await prisma.rawItem.updateMany({
    where: {
      id,
      OR: [
        { extractionStatus: { in: ["pending", "failed"] } },
        {
          extractionStatus: "processing",
          extractedAt: { lt: new Date(Date.now() - 120000) },
        },
      ],
    },
    data: { extractionStatus: "processing", extractedAt: new Date() },
  });
  if (!lock.count) return { status: 409, error: "Материал уже обрабатывается" };
  try {
    const result = await extractSignals({
      title: raw.title,
      content: raw.content,
      sourceType: raw.source.type,
    });
    const signal = await prisma.$transaction(async (tx) => {
      const created = result.is_relevant
        ? await tx.signal.create({
            data: {
              rawItemId: id,
              type: result.signal_type!,
              title: result.problem,
              groupingKey: result.problem_en,
              description: result.evidence_quote,
              pain: result.pain_point,
              customer: result.customer,
              industry: result.industry,
              strength: result.strength,
            },
          })
        : null;
      await tx.rawItem.update({
        where: { id },
        data: {
          extractionStatus: result.is_relevant ? "extracted" : "irrelevant",
          extractedAt: new Date(),
          metadata: JSON.stringify({
            ...metadata,
            extraction: {
              model: AI_MODEL,
              quote: result.evidence_quote,
              relevant: result.is_relevant,
              attempts,
            },
          }),
        },
      });
      return created;
    });
    return { status: 200, is_relevant: result.is_relevant, signal };
  } catch (e) {
    const failure = failureOf(e);
    // Reason codes only: no provider payload, source text or credentials.
    console.error(
      `[extraction] rawItem=${id} attempt=${attempts} reason=${failure.reason}${failure.httpStatus ? ` http=${failure.httpStatus}` : ""}`,
    );
    await prisma.rawItem.update({
      where: { id },
      data: {
        extractionStatus: "failed",
        metadata: JSON.stringify({
          ...metadata,
          extraction: {
            model: AI_MODEL,
            failedAt: new Date().toISOString(),
            attempts,
            ...failure,
          },
        }),
      },
    });
    return {
      status: 502,
      reason: failure.reason,
      error: `Извлечение не выполнено: ${failureLabel(failure.reason)}`,
    };
  }
}
