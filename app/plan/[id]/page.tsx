import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOpportunity } from "@/lib/opportunities";
import { currentUser } from "@/lib/auth";
import { getPlan, listPlans } from "@/lib/plans";
import { opportunityHref } from "@/lib/opportunity-types";
import { PageHeader } from "@/components/product-ui";
import PlanPanel from "@/components/plan-panel";
export const dynamic = "force-dynamic";
export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  const opportunity = await getOpportunity(id);
  if (!opportunity || opportunity.demo) notFound();
  const [stored, history] = await Promise.all([
    getPlan(user.id, opportunity.id, (await searchParams).plan),
    listPlans(user.id, opportunity.id),
  ]);
  const base = opportunityHref(opportunity);
  return (
    <div className="page-container">
      <Link href={base} className="text-sm text-muted-foreground hover:text-foreground">
        ← К возможности
      </Link>
      <div className="mt-7">
        <PageHeader
          eyebrow="Business Builder · план проверки"
          title={opportunity.title}
          description="Как дёшево проверить эту возможность до разработки: допущения, интервью, тест спроса и первая версия. Видно только вам."
        />
      </div>
      <PlanPanel
        key={stored?.id ?? "none"}
        opportunityId={opportunity.id}
        stored={stored}
        history={history}
        evidenceBase={base}
      />
    </div>
  );
}
