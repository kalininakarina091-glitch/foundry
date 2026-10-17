import { prisma } from "@/lib/db";
import { extractSignals, AI_MODEL } from "@/lib/ai";
import { traceableUrl } from "@/lib/traceability";
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
              description: result.evidence_quote,
              pain: result.pain_point,
              customer: result.customer,
              industry: result.industry,
              strength: result.strength,
            },
          })
        : null;
      let metadata: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(raw.metadata || "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
          metadata = parsed;
      } catch {}
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
            },
          }),
        },
      });
      return created;
    });
    return { status: 200, is_relevant: result.is_relevant, signal };
  } catch {
    await prisma.rawItem.update({
      where: { id },
      data: { extractionStatus: "failed" },
    });
    return {
      status: 502,
      error: "Провайдер не вернул корректное извлечение с исходной цитатой",
    };
  }
}
