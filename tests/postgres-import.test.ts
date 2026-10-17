import { test } from "node:test";
import assert from "node:assert/strict";
import { convertRow, fingerprint, checkReferences, tables } from "../scripts/sqlite-import-data.mjs";
import { hashId } from "../lib/traceability.ts";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const empty = () => Object.fromEntries(tables.map(t => [t, []])) as Record<string, Record<string, unknown>[]>;
test("a report path cannot overwrite the source database or any existing file", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "foundry-import-"));
  const source = path.join(directory, "source.db"), report = path.join(directory, "private.json");
  fs.writeFileSync(source, "unchanged source");
  fs.writeFileSync(report, "unchanged report");
  try {
    for (const destination of [source, report]) {
      const result = spawnSync(process.execPath, [fileURLToPath(new URL("../scripts/import-sqlite-postgres.mjs", import.meta.url)), "--sqlite", source, "--report", destination], { encoding: "utf8" });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Report destination already exists/);
    }
    assert.equal(fs.readFileSync(source, "utf8"), "unchanged source");
    assert.equal(fs.readFileSync(report, "utf8"), "unchanged report");
  } finally {
    fs.unlinkSync(source); fs.unlinkSync(report); fs.rmdirSync(directory);
  }
});
test("SQLite integer dates and booleans retain their PostgreSQL meaning", () => {
  const row = convertRow({ createdAt: 1728000000000, isAdmin: 0, onboardingCompleted: 1, description: "exact quote", publishedAt: null });
  assert.equal(row.createdAt.toISOString(), "2024-10-04T00:00:00.000Z");
  assert.equal(row.isAdmin, false);
  assert.equal(row.onboardingCompleted, true);
  assert.equal(row.description, "exact quote");
  assert.equal(row.publishedAt, null);
  assert.throws(() => convertRow({ createdAt: "invalid" }));
  assert.throws(() => convertRow({ isAdmin: 2 }));
});
test("content verification ignores ordering but catches altered IDs, quotes and JSON", () => {
  const a = [{ id: "a", quote: "literal quote", json: '{"x":1}' }, { id: "b", quote: "b", json: "{}" }];
  assert.equal(fingerprint(a), fingerprint([...a].reverse()));
  for (const field of ["id", "quote", "json"]) {
    assert.notEqual(fingerprint(a), fingerprint([{ ...a[0], [field]: "changed" }, a[1]]));
  }
});
test("import refuses broken ownership and duplicate signal references", () => {
  const data = empty();
  data.UserProfile.push({ userId: "missing" });
  assert.throws(() => checkReferences(data), /Broken UserProfile/);
  data.UserProfile = [];
  data.Source.push({ id: "source" });
  data.RawItem.push({ id: "raw", sourceId: "source" });
  data.Signal.push({ id: "signal", rawItemId: "raw", duplicateOf: "missing" });
  assert.throws(() => checkReferences(data), /Broken Signal/);
});
test("derived pattern identities and provenance stay tied to their exact source", () => {
  const data = empty();
  data.Source.push({ id: "source" });
  data.RawItem.push({ id: "raw", sourceId: "source", url: "https://example.org/issue/1" });
  data.Signal.push({ id: "signal", rawItemId: "raw", title: "claim", description: "exact quote" });
  const provenance = { version: 1, pattern: { id: hashId("pattern", ["signal"]), clusterId: hashId("cluster", ["signal"]), signalIds: ["signal"] }, signals: [{ signalId: "signal", rawItemId: "raw", sourceId: "source", quote: "exact quote", claim: "claim", url: "https://example.org/issue/1" }] };
  data.Opportunity.push({ id: "o", provenance: JSON.stringify(provenance) }, { id: "legacy", provenance: null });
  assert.deepEqual(checkReferences(data), { traceableOpportunities: 1, preservedLegacyOpportunities: 1 });
  data.Signal[0].description = "changed";
  assert.throws(() => checkReferences(data));
});
