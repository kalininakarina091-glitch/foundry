import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateJSON } from "@/lib/ai";
import { failureOf } from "@/lib/ai-errors";
import { fitSchema, FIT_PROMPT, toMatchAttributes } from "@/lib/match-fit";
// Admin-only through proxy. Estimates personalization attributes for
// opportunities generated before the fit estimate existed. Market data,
// evidence and Opportunity Score are not touched.
export async function POST(request: Request) {
  const body = z
    .object({ limit: z.number().int().min(1).max(5).default(3) })
    .safeParse(await request.json().catch(() => ({})));
  if (!body.success)
    return NextResponse.json({ error: "limit от 1 до 5" }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY)
    return NextResponse.json({ error: "AI-провайдер не настроен" }, { status: 503 });
  const items = await prisma.opportunity.findMany({
    where: { matchAttributes: null, provenance: { not: null } },
    orderBy: { createdAt: "asc" },
    take: body.data.limit,
    select: { id: true, title: true, description: true, industry: true, research: true },
  });
  let updated = 0;
  const failures: Record<string, number> = {};
  for (const o of items) {
    try {
      const output = z
        .object({ fit: fitSchema.nullable() })
        .parse(
          await generateJSON(
            `Estimate what one founder needs to build a first version of this product idea. Use only the description; return null for anything unclear. Return JSON with ${FIT_PROMPT}. Idea: ${JSON.stringify({ title: o.title, problem: o.description, research: o.research?.slice(0, 3000) })}`,
          ),
        );
      await prisma.opportunity.update({
        where: { id: o.id },
        data: {
          matchAttributes: JSON.stringify(toMatchAttributes(output.fit, o.industry)),
        },
      });
      updated++;
    } catch (e) {
      const { reason } = failureOf(e);
      failures[reason] = (failures[reason] || 0) + 1;
    }
  }
  const remaining = await prisma.opportunity.count({
    where: { matchAttributes: null, provenance: { not: null } },
  });
  return NextResponse.json({ processed: items.length, updated, failures, remaining });
}
