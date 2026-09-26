import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  await prisma.evidence.deleteMany({
    where: { opportunityId: id },
  });

  return NextResponse.json({ cleared: true });
}
