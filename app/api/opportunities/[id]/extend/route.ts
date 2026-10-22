import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { detectPatterns } from "@/lib/patterns";
import { findPatternOverlaps } from "@/lib/opportunity-overlap";
import { readProvenance, signalsFromProvenance } from "@/lib/provenance";
import { uniqueSignals } from "@/lib/traceability";
import { scoreSignals } from "@/lib/scoring";
// Admin-only through proxy. Adds the new members of a grown pattern to the
// opportunity that already traces the same problem, instead of generating a
// duplicate. The hypothesis text is unchanged; only evidence grows.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = z
    .object({ patternId: z.string().min(1).max(200) })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "Укажите patternId" }, { status: 400 });
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    select: { id: true, title: true, provenance: true },
  });
  const current = opportunity && readProvenance(opportunity.provenance);
  if (!opportunity || !current)
    return NextResponse.json(
      { error: "Возможность не найдена или без истории происхождения" },
      { status: 404 },
    );
  const pattern = (await detectPatterns()).find(
    (p) => p.id === body.data.patternId,
  );
  if (!pattern)
    return NextResponse.json(
      { error: "Паттерн отсутствует или устарел. Обновите список." },
      { status: 409 },
    );
  const [overlap] = findPatternOverlaps(pattern.signalIds, [opportunity]);
  if (!overlap?.extendable)
    return NextResponse.json(
      {
        error:
          "Паттерн не содержит всех сигналов этой возможности или не добавляет новых.",
      },
      { status: 409 },
    );
  const added = uniqueSignals(
    await prisma.signal.findMany({
      where: { id: { in: overlap.newSignalIds }, duplicateOf: null },
      include: { rawItem: { include: { source: true } } },
    }),
  );
  const provenance = {
    ...JSON.parse(opportunity.provenance!),
    pattern,
    extendedAt: new Date().toISOString(),
    signals: [
      ...current.signals,
      ...added.map((s) => ({
        signalId: s.id,
        rawItemId: s.rawItemId,
        sourceId: s.rawItem.sourceId,
        url: s.rawItem.url,
        quote: s.description,
        claim: s.title,
        // Cluster member added later; not selected by the generating model.
        addedBy: "pattern-extension",
      })),
    ],
  };
  const encoded = JSON.stringify(provenance);
  if (!readProvenance(encoded))
    return NextResponse.json(
      { error: "Не удалось сохранить согласованную историю происхождения" },
      { status: 409 },
    );
  const result = await prisma.$transaction(async (tx) => {
    for (const s of added)
      await tx.evidence.create({
        data: {
          opportunityId: id,
          signalId: s.id,
          claim: s.title,
          evidenceType: "neutral",
          strength: s.strength,
          sourceUrl: s.rawItem.url,
        },
      });
    const evidence = await tx.evidence.findMany({
      where: { opportunityId: id },
      include: {
        signal: { include: { rawItem: { include: { source: true } } } },
      },
    });
    const score = scoreSignals(
      signalsFromProvenance(
        encoded,
        evidence.map((e) => e.signal),
      ),
    ).overall;
    // A taken generation key only means another record already claims this
    // pattern; the evidence update is still valid.
    const keyFree = !(await tx.opportunity.findFirst({
      where: { generationKey: pattern.id, NOT: { id } },
      select: { id: true },
    }));
    await tx.opportunity.update({
      where: { id },
      data: {
        provenance: encoded,
        score,
        ...(keyFree ? { generationKey: pattern.id } : {}),
      },
    });
    return { added: added.length, score };
  });
  return NextResponse.json({ opportunityId: id, ...result });
}
