import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpportunity } from "@/lib/opportunities";
import { validateOpportunity } from "@/lib/ai";
import {
  evidenceStats,
  hasEnoughEvidence,
  insufficientReport,
  checkValidationReport,
} from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = z
    .object({ opportunityId: z.string().min(1), demo: z.boolean().optional() })
    .safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Укажите корректный opportunityId." },
      { status: 400 },
    );
  if (parsed.data.demo)
    return NextResponse.json(
      { error: "Демонстрационные примеры не проходят реальную проверку." },
      { status: 400 },
    );
  try {
    const opportunity = await getOpportunity(parsed.data.opportunityId);
    if (!opportunity)
      return NextResponse.json(
        { error: "Возможность не найдена." },
        { status: 404 },
      );
    // Bound provider context while making the scope of the report explicit.
    const evidence = opportunity.evidence.slice(0, 40);
    const stats = evidenceStats(evidence);
    if (!hasEnoughEvidence(evidence))
      return NextResponse.json({
        ...insufficientReport(),
        evidenceStats: stats,
        availableEvidence: opportunity.evidence.length,
      });
    if (!process.env.OPENROUTER_API_KEY)
      return NextResponse.json(
        {
          error:
            "AI-проверка не настроена. Добавьте ключ OpenRouter в окружение сервера.",
        },
        { status: 503 },
      );
    const result = await validateOpportunity({
      problem: opportunity.problem || opportunity.title,
      target_customer: opportunity.customer || "Не установлен",
      evidence,
    });
    const report = checkValidationReport(result, evidence);
    return NextResponse.json({
      ...report,
      evidenceStats: stats,
      availableEvidence: opportunity.evidence.length,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Не удалось завершить проверку. Проверьте подключение к базе и AI-провайдеру, затем повторите попытку.",
      },
      { status: 502 },
    );
  }
}
