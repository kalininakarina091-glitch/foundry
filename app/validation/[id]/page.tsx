import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/opportunities";
import ValidationPanel from "@/components/validation-panel";
export const dynamic = "force-dynamic";
export default async function ValidationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id } = await params;
  const opportunity = await getOpportunity(
    id,
    (await searchParams).mode === "demo",
  );
  if (!opportunity) notFound();
  return (
    <ValidationPanel
      key={`${id}-${opportunity.demo}`}
      opportunity={opportunity}
    />
  );
}
