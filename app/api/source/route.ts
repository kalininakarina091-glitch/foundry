import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { traceableUrl } from "@/lib/traceability";
export async function GET() {
  return NextResponse.json(
    await prisma.source.findMany({
      include: { _count: { select: { rawItems: true } } },
      orderBy: { createdAt: "asc" },
    }),
  );
}
export async function POST(request: Request) {
  const body = z
    .object({
      name: z.string().trim().min(1).max(120),
      type: z.enum(["hackernews", "github", "rss"]),
      url: z.string().url().max(2000),
    })
    .safeParse(await request.json().catch(() => null));
  if (!body.success || !traceableUrl(body.data.url))
    return NextResponse.json(
      {
        error: "Укажите название, поддерживаемый тип и публичный URL источника",
      },
      { status: 400 },
    );
  if (
    body.data.type === "github" &&
    new URL(body.data.url).hostname !== "github.com"
  )
    return NextResponse.json(
      { error: "Для GitHub укажите github.com или URL репозитория" },
      { status: 400 },
    );
  return NextResponse.json(await prisma.source.create({ data: body.data }), {
    status: 201,
  });
}
