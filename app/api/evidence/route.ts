import { NextResponse } from "next/server";
import { listOpportunities } from "@/lib/opportunities";
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("opportunityId");
  const records = (await listOpportunities()).filter(
    (o) => !id || id === "all" || o.id === id,
  );
  return NextResponse.json(
    records.flatMap((o) =>
      o.evidence.map((e) => ({ ...e, opportunityId: o.id })),
    ),
  );
}
