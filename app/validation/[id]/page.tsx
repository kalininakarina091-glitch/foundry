import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/opportunities";
import { getValidationRun, listValidationRuns } from "@/lib/validation-runs";
import ValidationPanel from "@/components/validation-panel";
export const dynamic = "force-dynamic";
export default async function ValidationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string; run?: string }>;
}) {
  const { id } = await params;
  const { mode, run } = await searchParams;
  const opportunity = await getOpportunity(id, mode === "demo");
  if (!opportunity) notFound();
  const [stored, history] = opportunity.demo
    ? [null, []]
    : await Promise.all([
        getValidationRun(opportunity.id, run),
        listValidationRuns(opportunity.id),
      ]);
  return (
    <ValidationPanel
      key={`${id}-${opportunity.demo}-${stored?.id ?? "none"}`}
      opportunity={opportunity}
      stored={stored}
      history={history}
    />
  );
}
