import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const opportunityId = searchParams.get("opportunityId");

  let evidence;

  if (opportunityId && opportunityId !== "all") {
    evidence = await prisma.evidence.findMany({
      where: { opportunityId },
      include: {
        signal: {
          include: {
            rawItem: {
              include: {
                source: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    evidence = await prisma.evidence.findMany({
      include: {
        signal: {
          include: {
            rawItem: {
              include: {
                source: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(evidence);
}
