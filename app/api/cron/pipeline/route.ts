import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cronAuthorization } from "@/lib/cron-auth";
import { syncSource } from "@/lib/source-sync";
import { extractRawItem } from "@/lib/extraction";
import { normalizeAllSignals } from "@/lib/normalize";
export const runtime = "nodejs";
const SYNC_INTERVAL_MS = 24 * 60 * 60000;
const EXTRACT_PER_RUN = 2;
// Called hourly by netlify/functions/pipeline-schedule.mts. Each run does one
// small step so it fits the scheduled-function time limit: sync the most
// overdue active source, otherwise extract a couple of pending materials.
export async function POST(request: Request) {
  const auth = cronAuthorization(
    request.headers.get("authorization"),
    process.env.CRON_SECRET,
  );
  if (auth === "missing")
    return NextResponse.json(
      { error: "CRON_SECRET не настроен" },
      { status: 503 },
    );
  if (auth === "denied")
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });

  const due = await prisma.source.findFirst({
    where: {
      status: "active",
      OR: [
        { lastSyncedAt: null },
        { lastSyncedAt: { lt: new Date(Date.now() - SYNC_INTERVAL_MS) } },
      ],
    },
    orderBy: { lastSyncedAt: { sort: "asc", nulls: "first" } },
    select: { id: true, name: true },
  });
  if (due) {
    const result = await syncSource(due.id);
    if (!result.ok)
      // Mark the attempt so one broken feed does not block every later run.
      await prisma.source.update({
        where: { id: due.id },
        data: { lastSyncedAt: new Date() },
      });
    console.log(
      `[cron] sync source=${due.id} ok=${result.ok}${result.ok ? ` imported=${result.imported}` : ` status=${result.status}`}`,
    );
    return NextResponse.json({ step: "sync", source: due.name, result });
  }

  if (!process.env.OPENROUTER_API_KEY)
    return NextResponse.json({ step: "idle", reason: "AI не настроен" });
  const pending = await prisma.rawItem.findMany({
    where: {
      extractionStatus: "pending",
      signals: { none: {} },
      source: { status: "active" },
    },
    orderBy: [{ fetchedAt: "asc" }, { id: "asc" }],
    take: EXTRACT_PER_RUN,
    select: { id: true },
  });
  if (!pending.length) return NextResponse.json({ step: "idle" });
  let relevant = 0;
  let errors = 0;
  for (const { id } of pending) {
    const r = await extractRawItem(id);
    if ("is_relevant" in r && r.is_relevant) relevant++;
    if (r.status >= 400) errors++;
  }
  // Normalization is cheap and makes new signals available to clustering.
  if (relevant) await normalizeAllSignals();
  console.log(
    `[cron] extract processed=${pending.length} relevant=${relevant} errors=${errors}`,
  );
  return NextResponse.json({
    step: "extract",
    processed: pending.length,
    relevant,
    errors,
  });
}
