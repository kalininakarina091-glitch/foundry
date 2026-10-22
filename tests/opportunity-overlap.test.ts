import { test } from "node:test";
import assert from "node:assert/strict";
import { findPatternOverlaps } from "../lib/opportunity-overlap.ts";
import { readProvenance } from "../lib/provenance.ts";
import { hashId } from "../lib/traceability.ts";

const entry = (id: string) => ({
  signalId: id,
  rawItemId: `raw-${id}`,
  sourceId: "hn",
  url: `https://news.ycombinator.com/item?id=${id}`,
  quote: `quote of signal ${id}`,
  claim: `claim ${id}`,
});
function provenance(patternIds: string[], supporting = patternIds) {
  return JSON.stringify({
    version: 1,
    pattern: {
      id: hashId("pattern", patternIds),
      clusterId: hashId("cluster", patternIds),
      signalIds: patternIds,
    },
    signals: supporting.map(entry),
  });
}
const existing = { id: "o1", title: "Сверка заказов", provenance: provenance(["a", "b"]) };

test("a grown pattern is offered as an extension, not a new opportunity", () => {
  const [o] = findPatternOverlaps(["a", "b", "c"], [existing]);
  assert.equal(o.opportunityId, "o1");
  assert.equal(o.extendable, true);
  assert.deepEqual(o.newSignalIds, ["c"]);
});

test("partial overlap blocks duplicates but is not an extension", () => {
  const [o] = findPatternOverlaps(["b", "c"], [existing]);
  assert.equal(o.extendable, false);
  assert.equal(o.shared, 1);
});

test("the same pattern has nothing new; unrelated and legacy records are ignored", () => {
  assert.equal(findPatternOverlaps(["a", "b"], [existing])[0].extendable, false);
  assert.deepEqual(findPatternOverlaps(["x", "y"], [existing]), []);
  assert.deepEqual(
    findPatternOverlaps(["a", "b"], [{ id: "legacy", title: "Старая", provenance: null }]),
    [],
  );
});

test("extended provenance stays verifiable", () => {
  const grown = ["a", "b", "c"];
  const extended = {
    ...JSON.parse(existing.provenance),
    pattern: { id: hashId("pattern", grown), clusterId: hashId("cluster", grown), signalIds: grown },
    signals: [...JSON.parse(existing.provenance).signals, { ...entry("c"), addedBy: "pattern-extension" }],
  };
  assert.ok(readProvenance(JSON.stringify(extended)));
  // A signal outside the pattern would break traceability.
  const broken = { ...extended, signals: [...extended.signals, entry("z")] };
  assert.equal(readProvenance(JSON.stringify(broken)), null);
});
