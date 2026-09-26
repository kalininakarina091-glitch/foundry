import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchSourceData } from "@/lib/sources";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const source = await prisma.source.findUnique({
    where: { id },
  });

  if (!source) {
    return NextResponse.json({ error: "Источник не найден" }, { status: 404 });
  }

  if (source.status !== "active") {
    return NextResponse.json({ error: "Источник не активен" }, { status: 400 });
  }

  try {
    const items = await fetchSourceData(source.type);

    let imported = 0;
    let skipped = 0;

    for (const item of items) {
      const existing = await prisma.rawItem.findFirst({
        where: { externalId: item.externalId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.rawItem.create({
        data: {
          sourceId: id,
          externalId: item.externalId,
          title: item.title,
          content: item.content,
          url: item.url,
          author: item.author,
          publishedAt: item.publishedAt,
        },
      });

      imported++;
    }

    await prisma.source.update({
      where: { id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({
      imported,
      skipped,
      total: items.length,
      source: source.name,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Ошибка синхронизации" },
      { status: 500 },
    );
  }
}
