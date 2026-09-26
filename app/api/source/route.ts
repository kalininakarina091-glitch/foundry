import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const sources = await prisma.source.findMany({
    include: {
      _count: {
        select: { rawItems: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(sources);
}

export async function POST(request: Request) {
  const body = await request.json();

  const source = await prisma.source.create({
    data: {
      name: body.name,
      type: body.type,
      url: body.url,
    },
  });

  return NextResponse.json(source);
}
