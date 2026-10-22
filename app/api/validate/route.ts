import { NextResponse } from "next/server";
import { z } from "zod";
import { getOpportunity } from "@/lib/opportunities";
import { validateOpportunity, AI_MODEL } from "@/lib/ai";
import { saveValidationRun } from "@/lib/validation-runs";
import {
  evidenceStats,
  hasEnoughEvidence,
  insufficientReport,
  checkValidationReport,
} from "@/lib/validation";
import { currentUser } from "@/lib/auth";
import { limitKey } from "@/lib/client-ip";
import { consumeLimits } from "@/lib/rate-limit";
const VALIDATIONS_PER_HOUR = 10;

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
    // Earlier verdicts are display-only and must not anchor a new validation.
    const evidence = opportunity.evidence.slice(0, 40).map((e) => {
      const { stance, stanceCheckedAt, ...rest } = e;
      void stance;
      void stanceCheckedAt;
      return rest;
    });
    const stats = evidenceStats(evidence);
    if (!hasEnoughEvidence(evidence))
      return NextResponse.json({
        ...insufficientReport(),
        evidenceStats: stats,
        availableEvidence: opportunity.evidence.length,
        evidenceSnapshot: evidence,
        checkedAt: new Date().toISOString(),
      });
    if (!process.env.OPENROUTER_API_KEY)
      return NextResponse.json(
        {
          error:
            "AI-проверка не настроена. Добавьте ключ OpenRouter в окружение сервера.",
        },
        { status: 503 },
      );
    // Each call reaching the provider is paid; bound it per signed-in user.
    const user = await currentUser();
    if (!user)
      return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
    if (
      !(await consumeLimits([
        {
          key: limitKey("validate-user", user.id),
          max: VALIDATIONS_PER_HOUR,
          windowMs: 60 * 60000,
        },
      ]))
    )
      return NextResponse.json(
        {
          error: `Лимит AI-проверок: ${VALIDATIONS_PER_HOUR} в час. Повторите позже.`,
        },
        { status: 429 },
      );
    const result = await validateOpportunity({
      problem: opportunity.problem || opportunity.title,
      target_customer: opportunity.customer || "Не установлен",
      evidence,
    });
    const report = checkValidationReport(result, evidence);
    const run = await saveValidationRun({
      opportunityId: opportunity.id,
      userId: user.id,
      model: AI_MODEL,
      report,
      evidenceSnapshot: evidence,
      evidenceStats: stats,
      availableEvidence: opportunity.evidence.length,
    });
    return NextResponse.json({
      ...report,
      runId: run.id,
      evidenceStats: stats,
      availableEvidence: opportunity.evidence.length,
      evidenceSnapshot: evidence,
      checkedAt: run.createdAt.toISOString(),
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
