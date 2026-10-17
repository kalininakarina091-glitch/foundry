import Link from "next/link";
import { listOpportunities } from "@/lib/opportunities";
import { EvidenceCard } from "@/components/product-ui";
export const dynamic = "force-dynamic";
export default async function EvidencePage() {
  const opportunities = await listOpportunities();
  return (
    <div className="page-container">
      <h1 className="page-title">Доказательства</h1>
      <p className="my-4 text-muted-foreground">
        Демонстрационные ссылки и повторные материалы исключены. Ссылки
        показывают происхождение, а не истинность утверждений.
      </p>
      {opportunities.map((o) => (
        <section key={o.id} className="my-8">
          <h2 className="mb-3">
            <Link href={`/opportunities/${encodeURIComponent(o.id)}`}>
              {o.title} →
            </Link>
          </h2>
          <p className="mb-3 text-sm">
            {o.evidence.length} материалов · исключено {o.excludedEvidence || 0}
          </p>
          <div className="space-y-3">
            {o.evidence.map((e) => (
              <EvidenceCard key={e.id} evidence={e} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
