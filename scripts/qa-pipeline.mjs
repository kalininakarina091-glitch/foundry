/** Run only against a disposable audit database. Real ingestion / AI extraction are recorded separately. */
import assert from "node:assert/strict";
import fs from "node:fs";
const base = process.env.QA_BASE_URL;
const opportunityId = process.env.QA_OPPORTUNITY_ID;
if (
  !base ||
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) ||
  process.env.QA_ALLOW_MUTATIONS !== "1" ||
  !opportunityId
)
  throw new Error(
    "Set QA_BASE_URL (local isolated server), QA_OPPORTUNITY_ID and QA_ALLOW_MUTATIONS=1. This test clears/restores the selected opportunity evidence.",
  );
const checks = [];
async function api(path, method = "GET", body, expected = 200) {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(70000),
  });
  const data = await r.json();
  assert.equal(
    r.status,
    expected,
    `${method} ${path}: ${JSON.stringify(data)}`,
  );
  checks.push({ path, method, status: r.status });
  return data;
}
const list = await api("/api/opportunities");
const o = list.find((o) => o.id === opportunityId);
assert.ok(
  o?.origin && o.evidence.length >= 2,
  "Select an audit-generated opportunity with evidence",
);
const initialIds = o.evidence.map((e) => e.signalId).sort();
const initialScore = await api(`/api/opportunities/${o.id}/score`);
assert.equal(initialScore.overall, o.score);
assert.equal(initialScore.materials, o.evidence.length);
assert.ok(
  o.evidence.every(
    (e) =>
      o.origin.signalIds.includes(e.signalId) &&
      e.quote &&
      e.rawItemId &&
      e.sourceId &&
      e.url,
  ),
);
const normalized1 = await api("/api/signals/normalize", "POST");
const normalized2 = await api("/api/signals/normalize", "POST");
assert.deepEqual(normalized1, normalized2);
const patterns = await api("/api/patterns");
const clusters = await api("/api/clusters");
const pattern = patterns.find((p) => p.id === o.origin.patternId);
assert.ok(pattern);
assert.deepEqual(
  pattern.signalIds,
  clusters.find((c) => c.id === pattern.clusterId).signalIds,
);
const repeat = await api("/api/opportunities/generate", "POST", {
  patternId: pattern.id,
});
assert.equal(repeat.savedId, o.id);
assert.equal(repeat.reused, true);
await api(
  "/api/opportunities/generate",
  "POST",
  { clusterName: "freelancer" },
  400,
);
await api(
  "/api/opportunities/generate",
  "POST",
  { patternId: "missing-pattern" },
  409,
);
await api("/api/analyze", "POST", { text: "arbitrary untraceable idea" }, 410);
await api("/api/signals/extract", "POST", { rawItemId: "missing-item" }, 404);
const repeatedExtraction = await api("/api/signals/extract", "POST", {
  rawItemId: o.evidence[0].rawItemId,
});
assert.equal(repeatedExtraction.skipped, true);
await api("/api/signals/extract-batch", "POST", { limit: 100 }, 400);
await api(
  "/api/source",
  "POST",
  { name: "Invalid", type: "rss", url: "http://localhost/feed" },
  400,
);
await api("/api/source/missing-source/sync", "POST", {}, 404);
await api("/api/source/reddit/sync", "POST", {}, 409);
await api("/api/source/rss-feeds/sync", "POST", {}, 502);
await api("/api/validate", "POST", { opportunityId: o.id, demo: true }, 400);
await api(
  "/api/validate",
  "POST",
  { opportunityId: "missing-opportunity" },
  404,
);
const report = await api("/api/validate", "POST", { opportunityId: o.id });
assert.equal(report.recommendation, "RESEARCH MORE");
assert.deepEqual(
  report.evidenceSnapshot.map((e) => e.signalId).sort(),
  initialIds,
);
await api(`/api/opportunities/${o.id}/clear-evidence`, "POST");
const cleared = await api(`/api/opportunities/${o.id}/score`);
assert.equal(cleared.overall, 0);
assert.equal(cleared.materials, 0);
const emptyReport = await api("/api/validate", "POST", { opportunityId: o.id });
assert.equal(emptyReport.availableEvidence, 0);
assert.equal(emptyReport.recommendation, "RESEARCH MORE");
const restored = await api(`/api/opportunities/${o.id}/link-signals`, "POST", {
  limit: 40,
});
assert.equal(restored.linked, initialIds.length);
const restoredAgain = await api(
  `/api/opportunities/${o.id}/link-signals`,
  "POST",
  { limit: 40 },
);
assert.equal(restoredAgain.linked, 0);
const final = (await api("/api/opportunities")).find((p) => p.id === o.id);
assert.deepEqual(final.evidence.map((e) => e.signalId).sort(), initialIds);
assert.equal(final.score, initialScore.overall);
const legacy = list.find((p) => !p.origin);
if (legacy) {
  await api(
    `/api/opportunities/${legacy.id}/link-signals`,
    "POST",
    { limit: 3 },
    409,
  );
  assert.equal(legacy.score, 0);
}
const pages = [
  "/dashboard",
  "/opportunities",
  "/settings",
  "/sources",
  "/signals",
  "/clusters",
  "/patterns",
  "/evidence",
  "/login",
  "/signup",
  "/reports",
  "/team",
  "/alerts",
  "/simulator",
  "/integrations",
  `/opportunities/${o.id}`,
  `/validation/${o.id}`,
];
for (const path of pages) {
  const r = await fetch(base + path);
  assert.equal(r.status, 200, path);
  const html = await r.text();
  assert.ok(!html.includes("Application error:"), path);
  checks.push({ path, method: "GET", status: r.status });
}
const result = {
  ranAt: new Date().toISOString(),
  opportunityId: o.id,
  patternId: pattern.id,
  signalIds: initialIds,
  score: initialScore,
  validation: report.recommendation,
  checks,
};
if (process.env.QA_REPORT_PATH)
  fs.writeFileSync(process.env.QA_REPORT_PATH, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
