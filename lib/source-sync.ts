import { prisma } from "@/lib/db";
import { fetchSourceData } from "@/lib/sources";
import { traceableUrl } from "@/lib/traceability";
export type SyncResult =
  | {
      ok: true;
      imported: number;
      skipped: number;
      excluded: number;
      total: number;
      source: string;
    }
  | { ok: false; status: number; error: string; excluded?: number };
/** Imports new materials of one active source; existing ones are skipped. */
export async function syncSource(id: string): Promise<SyncResult> {
  const source = await prisma.source.findUnique({ where: { id } });
  if (!source) return { ok: false, status: 404, error: "Источник не найден" };
  if (source.status !== "active")
    return { ok: false, status: 409, error: "Источник не активен" };
  if (!["hackernews", "github", "rss"].includes(source.type))
    return { ok: false, status: 422, error: "Коннектор не реализован" };
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
        // A link already imported by any source is the same material: a post
        // can appear in a community feed and in a phrase search.
        const existing = await tx.rawItem.findFirst({
          where: {
            OR: [{ sourceId: id, externalId: item.externalId }, { url }],
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
      return {
        ok: false,
        status: 422,
        error: "Источник не вернул пригодных ссылок",
        excluded,
      };
    await prisma.source.update({
      where: { id },
      data: { lastSyncedAt: new Date() },
    });
    return {
      ok: true,
      imported,
      skipped,
      excluded,
      total: items.length,
      source: source.name,
    };
  } catch {
    return {
      ok: false,
      status: 502,
      error:
        "Синхронизация не завершена. Проверьте URL, доступность и формат источника. Возможен частичный импорт; повторный запуск пропустит уже записанные материалы.",
    };
  }
}
