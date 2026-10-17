import { test } from "node:test";
import assert from "node:assert/strict";
import {
  groupSignals,
  uniqueSignals,
  traceableUrl,
  normalizeText,
  type PipelineSignal,
} from "../lib/traceability.ts";
import { scoreSignals } from "../lib/evidence-score.ts";
function signal(
  id: string,
  problem = "Teams cannot export accessible audit reports",
  url = `https://github.com/acme/tool/issues/${id}`,
): PipelineSignal {
  return {
    id,
    title: problem,
    description: problem,
    normalizedProblem: normalizeText(problem),
    customer: null,
    industry: null,
    type: "pain",
    strength: 0.8,
    createdAt: new Date(),
    duplicateOf: null,
    rawItem: {
      id: `raw-${id}`,
      url,
      content: problem,
      sourceId: "github",
      publishedAt: null,
      source: { id: "github", name: "GitHub", type: "github" },
    },
  };
}
test("placeholder and private URLs cannot become evidence", () => {
  for (const url of [
    "https://example.com/a",
    "https://sub.example.org/a",
    "http://localhost:3000",
    "http://192.168.1.1/a",
    "javascript:alert(1)",
    "https://user:pass@github.com/a",
  ])
    assert.equal(traceableUrl(url), null);
  assert.equal(
    traceableUrl("https://github.com/a?utm_source=x&b=1#frag"),
    "https://github.com/a?b=1",
  );
});
test("dedup removes repeated publications but preserves independent identical observations", () => {
  const a = signal("1"),
    b = signal("2"),
    repeat = signal("3", a.title!, a.rawItem.url! + "?utm_source=copy");
  assert.deepEqual(
    uniqueSignals([a, b, repeat]).map((s) => s.id),
    ["1", "2"],
  );
  assert.equal(groupSignals([a, b, repeat])[0].members.length, 2);
});
test("membership and cluster IDs are stable without domain dictionaries", () => {
  const a = signal("1"),
    b = signal("2"),
    unrelated = signal(
      "3",
      "Farmers need reliable irrigation weather forecasts",
    );
  const forward = groupSignals([a, b, unrelated]),
    reverse = groupSignals([unrelated, b, a]);
  assert.equal(forward.length, 1);
  assert.deepEqual(forward, reverse);
  assert.deepEqual(
    forward[0].members.map((s) => s.id),
    ["1", "2"],
  );
  assert.equal(
    groupSignals([
      signal("4", "Пользователи теряют сохранённые настройки приложения"),
      signal("5", "Пользователи теряют сохранённые настройки приложения"),
    ]).length,
    1,
  );
});
test("complete-link prevents unrelated endpoints being joined by a bridge", () => {
  assert.equal(
    groupSignals([
      signal("1", "alpha bravo charlie delta"),
      signal("2", "alpha bravo charlie delta echo foxtrot"),
      signal("3", "charlie delta echo foxtrot golf hotel"),
    ])[0].members.length,
    2,
  );
});
test("scores are zero without real evidence and cannot be inflated by duplicate links", () => {
  assert.equal(scoreSignals([]).overall, 0);
  assert.equal(
    scoreSignals([signal("0", "Example", "https://example.com/a")]).overall,
    0,
  );
  const a = signal("1");
  assert.deepEqual(scoreSignals([a, a]), scoreSignals([a]));
  assert.equal(scoreSignals([a]).method, "evidence-support-v1");
});

test("provenance rejects unrelated, changed and legacy evidence", async () => {
  const { signalsFromProvenance } = await import("../lib/provenance.ts");
  const { hashId } = await import("../lib/traceability.ts");
  const a = signal("1"),
    b = signal("2"),
    unrelated = signal("3");
  const provenance = JSON.stringify({
    version: 1,
    pattern: {
      id: hashId("pattern", ["1", "2"]),
      clusterId: hashId("cluster", ["1", "2"]),
      signalIds: ["1", "2"],
    },
    signals: [a, b].map((s) => ({
      signalId: s.id,
      rawItemId: s.rawItem.id,
      sourceId: s.rawItem.sourceId,
      url: s.rawItem.url,
      quote: s.description,
      claim: s.title,
    })),
  });
  assert.deepEqual(
    signalsFromProvenance(provenance, [a, b, unrelated]).map((s) => s.id),
    ["1", "2"],
  );
  assert.equal(signalsFromProvenance(null, [a, b]).length, 0);
  assert.equal(
    signalsFromProvenance(provenance, [{ ...a, title: "Changed claim" }])
      .length,
    0,
  );
  assert.equal(
    signalsFromProvenance(provenance, [
      { ...a, description: "Invented verbatim quote" },
    ]).length,
    0,
  );
});
