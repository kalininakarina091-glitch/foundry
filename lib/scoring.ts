import { signalsFromProvenance } from "./provenance";
import { prisma } from "@/lib/db";
import { scoreSignals } from "./evidence-score";
export { scoreSignals } from "./evidence-score";
export async function scoreOpportunity(id: string) {
  const o = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      evidence: {
        include: {
          signal: { include: { rawItem: { include: { source: true } } } },
        },
      },
    },
  });
  if (!o) throw new Error("Opportunity not found");
  return scoreSignals(
    signalsFromProvenance(
      o.provenance,
      o.evidence.map((e) => e.signal),
    ),
  );
}
