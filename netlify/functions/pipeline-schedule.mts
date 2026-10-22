// Netlify Scheduled Function: runs only on the published production deploy.
// It triggers one small pipeline step in the app; all logic and the
// CRON_SECRET check live in app/api/cron/pipeline/route.ts.
export default async function pipelineSchedule() {
  const origin = process.env.APP_ORIGIN || process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!origin || !secret) {
    console.log("[schedule] skipped: APP_ORIGIN/URL or CRON_SECRET is not set");
    return new Response(null, { status: 204 });
  }
  const response = await fetch(new URL("/api/cron/pipeline", origin), {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    redirect: "error",
    signal: AbortSignal.timeout(28000),
  }).catch((e: unknown) => {
    console.log(`[schedule] request failed: ${e instanceof Error ? e.name : "error"}`);
    return null;
  });
  if (response)
    console.log(
      `[schedule] status=${response.status} ${(await response.text()).slice(0, 300)}`,
    );
  return new Response(null, { status: 204 });
}
export const config = { schedule: "@hourly" };
