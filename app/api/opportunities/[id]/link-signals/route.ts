import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readProvenance, signalsFromProvenance } from "@/lib/provenance";
import { scoreSignals } from "@/lib/scoring";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = z
    .object({ limit: z.number().int().min(1).max(40).default(5) })
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "Некорректный limit" }, { status: 400 });
  const opportunity = await prisma.opportunity.findUnique({ where: { id } });
  if (!opportunity)
    return NextResponse.json(
      { error: "Возможность не найдена" },
      { status: 404 },
    );
  const signalIds =
    readProvenance(opportunity.provenance)?.signals.map((s) => s.signalId) ||
    [];
  if (!signalIds.length)
    return NextResponse.json(
      {
        error:
          "У старой возможности нет сохранённого происхождения. Создайте новую из проверяемого паттерна; автоматическая привязка случайных сигналов отключена.",
      },
      { status: 409 },
    );
  const result = await prisma.$transaction(async (tx) => {
    const signals = await tx.signal.findMany({
      where: {
        id: { in: signalIds },
        duplicateOf: null,
        evidence: { none: { opportunityId: id } },
      },
      include: { rawItem: { include: { source: true } } },
      take: body.data.limit,
    });
    let linked = 0;
    for (const s of signalsFromProvenance(opportunity.provenance, signals)) {
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
      linked++;
    }
    const evidence = await tx.evidence.findMany({
      where: { opportunityId: id },
      include: {
        signal: { include: { rawItem: { include: { source: true } } } },
      },
    });
    await tx.opportunity.update({
      where: { id },
      data: {
        score: scoreSignals(
          signalsFromProvenance(
            opportunity.provenance,
            evidence.map((e) => e.signal),
          ),
        ).overall,
      },
    });
    return { linked, skipped: 0, total: signals.length };
  });
  return NextResponse.json(result);
}
