import { prisma } from "@/lib/db";
import { planSchema, type Place, type Plan } from "@/lib/business-plan";
export interface StoredPlan {
  id: string;
  plan: Plan;
  places: Place[];
  model: string;
  createdAt: string;
}
function parse(row: { id: string; content: string; model: string; createdAt: Date }): StoredPlan | null {
  try {
    const value = JSON.parse(row.content);
    const plan = planSchema.safeParse(value?.plan);
    if (!plan.success || !Array.isArray(value?.places)) return null;
    return {
      id: row.id,
      plan: plan.data,
      places: value.places,
      model: row.model,
      createdAt: row.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}
export async function savePlan(input: {
  userId: string;
  opportunityId: string;
  model: string;
  plan: Plan;
  places: Place[];
}) {
  const row = await prisma.opportunityPlan.create({
    data: {
      userId: input.userId,
      opportunityId: input.opportunityId,
      model: input.model,
      content: JSON.stringify({ plan: input.plan, places: input.places }),
    },
  });
  return parse(row)!;
}
/** The user's plan by id, or their latest plan for the opportunity. */
export async function getPlan(userId: string, opportunityId: string, planId?: string) {
  const row = await prisma.opportunityPlan.findFirst({
    where: { userId, opportunityId, ...(planId ? { id: planId } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return row ? parse(row) : null;
}
export async function listPlans(userId: string, opportunityId: string) {
  return (
    await prisma.opportunityPlan.findMany({
      where: { userId, opportunityId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, createdAt: true },
    })
  ).map((p) => ({ id: p.id, createdAt: p.createdAt.toISOString() }));
}
