import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchSourceData } from "@/lib/sources";
import { traceableUrl } from "@/lib/traceability";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const source = await prisma.source.findUnique({ where: { id } });
  if (!source)
    return NextResponse.json({ error: "Источник не найден" }, { status: 404 });
  if (source.status !== "active")
    return NextResponse.json({ error: "Источник не активен" }, { status: 409 });
  if (!["hackernews", "github", "rss"].includes(source.type))
    return NextResponse.json(
      { error: "Коннектор не реализован" },
      { status: 422 },
    );
  try {
    const items = await fetchSourceData(source.type, source.url);
    let imported = 0;
    let skipped = 0;
    let excluded = 0;
    for (const item of items) {
      const url = traceableUrl(item.url);
      if (!url) {
        excluded++;
        continue;
      }
      const created = await prisma.$transaction(async (tx) => {
        const existing = await tx.rawItem.findFirst({
          where: {
            sourceId: id,
            OR: [{ externalId: item.externalId }, { url }],
          },
        });
        if (existing) return false;
        await tx.rawItem.create({
          data: {
            ...item,
            url,
            sourceId: id,
            publishedAt:
              item.publishedAt && !Number.isNaN(item.publishedAt.getTime())
                ? item.publishedAt
                : null,
            metadata: JSON.stringify({
              ingestion: {
                connector: source.type,
                sourceUrl: source.url,
                fetchedAt: new Date().toISOString(),
              },
            }),
          },
        });
        return true;
      });
      if (created) imported++;
      else skipped++;
    }
    if (items.length && excluded === items.length)
      return NextResponse.json(
        { error: "Источник не вернул пригодных ссылок", excluded },
        { status: 422 },
      );
    await prisma.source.update({
      where: { id },
      data: { lastSyncedAt: new Date() },
    });
    return NextResponse.json({
      imported,
      skipped,
      excluded,
      total: items.length,
      source: source.name,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Синхронизация не завершена. Проверьте URL, доступность и формат источника. Возможен частичный импорт; повторный запуск пропустит уже записанные материалы.",
      },
      { status: 502 },
    );
  }
}
