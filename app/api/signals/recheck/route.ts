import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { extractSignals, AI_MODEL } from "@/lib/ai";
import { failureOf } from "@/lib/ai-errors";
import { readMetadata } from "@/lib/extraction";
// Admin-only through proxy. Re-runs signals extracted before the material
// kind gate through the current model and rules. A signal that no longer
// qualifies is kept for provenance, but its material becomes "irrelevant",
// which removes it from clustering, opportunity evidence and Score.
const needsRecheck = (metadata: string | null) => {
  const extraction = readMetadata(metadata).extraction as
    | { materialKind?: unknown; recheck?: unknown }
    | undefined;
  return !extraction?.materialKind && !extraction?.recheck;
};
export async function POST(request: Request) {
  const body = z
    .object({ limit: z.number().int().min(1).max(5).default(3) })
    .safeParse(await request.json().catch(() => ({})));
  if (!body.success)
    return NextResponse.json({ error: "limit от 1 до 5" }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY)
    return NextResponse.json({ error: "AI-провайдер не настроен" }, { status: 503 });
  const candidates = (
    await prisma.rawItem.findMany({
      where: { extractionStatus: "extracted", signals: { some: {} } },
      orderBy: [{ fetchedAt: "asc" }, { id: "asc" }],
      include: {
        source: true,
        signals: { include: { _count: { select: { evidence: true } } } },
      },
    })
  ).filter((r) => needsRecheck(r.metadata));
  const batch = candidates.slice(0, body.data.limit);
  let kept = 0;
  let excluded = 0;
  const failures: Record<string, number> = {};
  for (const raw of batch) {
    const metadata = readMetadata(raw.metadata);
    try {
      const result = await extractSignals({
        title: raw.title,
        content: raw.content,
        sourceType: raw.source.type,
      });
      const recheck = {
        model: AI_MODEL,
        at: new Date().toISOString(),
        relevant: result.is_relevant,
        materialKind: result.material_kind ?? null,
        ...(result.rejected ? { rejected: result.rejected } : {}),
      };
      await prisma.$transaction(async (tx) => {
        await tx.rawItem.update({
          where: { id: raw.id },
          data: {
            ...(result.is_relevant ? {} : { extractionStatus: "irrelevant" }),
            metadata: JSON.stringify({
              ...metadata,
              extraction: { ...(metadata.extraction as object), recheck },
            }),
          },
        });
        // Signals cited as evidence keep their exact text: provenance hashes
        // the claim and quote. Uncited ones take the current wording.
        if (result.is_relevant)
          for (const s of raw.signals.filter((s) => !s._count.evidence))
            await tx.signal.update({
              where: { id: s.id },
              data: {
                type: result.signal_type!,
                title: result.problem,
                groupingKey: result.problem_en,
                description: result.evidence_quote,
                pain: result.pain_point,
                customer: result.customer,
                industry: result.industry,
                strength: result.strength,
                embedding: null,
              },
            });
      });
      if (result.is_relevant) kept++;
      else excluded++;
    } catch (e) {
      const { reason } = failureOf(e);
      failures[reason] = (failures[reason] || 0) + 1;
    }
  }
  return NextResponse.json({
    processed: batch.length,
    kept,
    excluded,
    errors: batch.length - kept - excluded,
    failures,
    remaining: candidates.length - batch.length,
  });
}
