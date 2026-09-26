import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const opportunities = await prisma.opportunity.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      evidence: true,
    },
  });

  return NextResponse.json(opportunities);
}
