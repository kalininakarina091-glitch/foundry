import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
// Admin-only through proxy. A disabled source keeps its materials and
// signals; it is skipped by sync and extraction until enabled again.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = z
    .object({ status: z.enum(["active", "disabled"]) })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: "Укажите статус active или disabled" },
      { status: 400 },
    );
  const updated = await prisma.source.updateMany({
    where: { id },
    data: { status: body.data.status },
  });
  if (!updated.count)
    return NextResponse.json({ error: "Источник не найден" }, { status: 404 });
  return NextResponse.json({ id, status: body.data.status });
}
