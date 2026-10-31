import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getOpportunity } from "@/lib/opportunities";
import { getValidationRun } from "@/lib/validation-runs";
import { generateJSON, AI_MODEL } from "@/lib/ai";
import { failureLabel, failureOf } from "@/lib/ai-errors";
import { checkPlan, placesFromEvidence, planPrompt } from "@/lib/business-plan";
import { savePlan } from "@/lib/plans";
import { budgets, decodeProfile, skills, teams, times } from "@/lib/personal-profile";
import { limitKey } from "@/lib/client-ip";
import { consumeLimits } from "@/lib/rate-limit";
const PLANS_PER_HOUR = 5;
const label = (map: Record<string, string>, v: string | null) =>
  v && Object.hasOwn(map, v) ? map[v] : null;
// Any signed-in user can build a plan for themselves (personal data under
// /api/me-like ownership: the owner comes from the session only).
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Войдите в аккаунт." }, { status: 401 });
  const body = z
    .object({ opportunityId: z.string().min(1).max(200) })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "Укажите возможность." }, { status: 400 });
  const opportunity = await getOpportunity(body.data.opportunityId);
  if (!opportunity || opportunity.demo)
    return NextResponse.json({ error: "Возможность не найдена." }, { status: 404 });
  if (!opportunity.evidence.length)
    return NextResponse.json(
      { error: "У возможности нет проверяемых доказательств — план не на что опереть." },
      { status: 409 },
    );
  if (!process.env.OPENROUTER_API_KEY)
    return NextResponse.json({ error: "AI-провайдер не настроен." }, { status: 503 });
  if (
    !(await consumeLimits([
      { key: limitKey("plan-user", user.id), max: PLANS_PER_HOUR, windowMs: 60 * 60000 },
    ]))
  )
    return NextResponse.json(
      { error: `Лимит планов: ${PLANS_PER_HOUR} в час. Повторите позже.` },
      { status: 429 },
    );
  const [profileRow, run] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    getValidationRun(opportunity.id),
  ]);
  const profile = decodeProfile(profileRow);
  const evidence = opportunity.evidence.map((e) => ({
    id: e.id,
    claim: e.claim,
    quote: e.quote,
    source: e.source,
    url: e.url,
  }));
  try {
    const plan = checkPlan(
      await generateJSON(
        planPrompt({
          title: opportunity.title,
          problem: opportunity.problem,
          customer: opportunity.customer,
          evidence,
          validation: run
            ? { biggest_risk: run.report.biggest_risk, what_would_change: run.report.what_would_change }
            : null,
          founder: {
            skills: profile.skills.map((s) => label(skills, s)).filter((s): s is string => !!s),
            budget: label(budgets, profile.budget),
            time: label(times, profile.time),
            team: label(teams, profile.team),
          },
        }),
        3500,
      ),
      evidence.map((e) => e.id),
    );
    const saved = await savePlan({
      userId: user.id,
      opportunityId: opportunity.id,
      model: AI_MODEL,
      plan,
      places: placesFromEvidence(evidence),
    });
    return NextResponse.json(saved);
  } catch (e) {
    const { reason } = failureOf(e);
    return NextResponse.json(
      { error: `План не построен: ${failureLabel(reason)}. Повторите попытку.` },
      { status: 502 },
    );
  }
}
