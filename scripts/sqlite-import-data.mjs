import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Parents precede children; additional unmapped tables fail closed.
export const tables = ["Source", "RawItem", "Signal", "Opportunity", "Evidence", "User", "UserProfile", "Session", "SavedOpportunity", "OpportunityFeedback", "AuthThrottle"];
const dates = new Set(["lastSyncedAt", "createdAt", "publishedAt", "fetchedAt", "extractedAt", "updatedAt", "expiresAt"]);
const booleans = new Set(["isAdmin", "onboardingCompleted", "onboardingSkipped"]);
export function convertRow(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => {
    if (value !== null && dates.has(key)) {
      const date = new Date(typeof value === "bigint" ? Number(value) : value);
      assert.ok(Number.isFinite(date.getTime()), `Invalid timestamp in ${key}`);
      return [key, date];
    }
    if (value !== null && booleans.has(key)) {
      assert.ok(value === 0 || value === 1 || typeof value === "boolean", `Invalid boolean in ${key}`);
      return [key, !!value];
    }
    return [key, value];
  }));
}
export function canonical(row) {
  return JSON.stringify(Object.fromEntries(Object.keys(row).sort().map(k => [k, row[k] instanceof Date ? row[k].toISOString() : row[k]])));
}
export function fingerprint(rows) {
  return createHash("sha256").update(rows.map(canonical).sort().join("\n")).digest("hex");
}
export function checkReferences(data) {
  const ids = Object.fromEntries(tables.map(t => [t, new Set(data[t].map(r => r.id ?? r.userId ?? r.tokenHash ?? r.key))]));
  const edges = {
    RawItem: { sourceId: "Source" }, Signal: { rawItemId: "RawItem", duplicateOf: "Signal" },
    Evidence: { signalId: "Signal", opportunityId: "Opportunity" },
    UserProfile: { userId: "User" }, Session: { userId: "User" },
    SavedOpportunity: { userId: "User", opportunityId: "Opportunity" },
    OpportunityFeedback: { userId: "User", opportunityId: "Opportunity" },
  };
  for (const [table, links] of Object.entries(edges))
    for (const row of data[table]) for (const [field, parent] of Object.entries(links))
      if (row[field] != null) assert.ok(ids[parent].has(row[field]), `Broken ${table}.${field} reference`);
  let traced = 0, legacy = 0;
  const signals = new Map(data.Signal.map(s => [s.id, s]));
  const raws = new Map(data.RawItem.map(r => [r.id, r]));
  const hashId = (prefix, list) => `${prefix}-${createHash("sha256").update(JSON.stringify([...list].sort())).digest("hex").slice(0,24)}`;
  for (const o of data.Opportunity) {
    if (!o.provenance) { legacy++; continue; }
    const p = JSON.parse(o.provenance);
    assert.equal(p.version, 1, "Unsupported provenance version");
    assert.equal(p.pattern.id, hashId("pattern", p.pattern.signalIds), "Pattern identity mismatch");
    assert.equal(p.pattern.clusterId, hashId("cluster", p.pattern.signalIds), "Cluster identity mismatch");
    for (const sid of p.pattern.signalIds) assert.ok(signals.has(sid), "Missing pattern member");
    for (const original of p.signals) {
      const s = signals.get(original.signalId), r = raws.get(original.rawItemId);
      assert.ok(s && r, "Missing provenance member");
      assert.equal(s.rawItemId, r.id); assert.equal(r.sourceId, original.sourceId);
      assert.equal(s.description, original.quote); assert.equal(s.title, original.claim);
      assert.equal(r.url, original.url);
    }
    traced++;
  }
  return { traceableOpportunities: traced, preservedLegacyOpportunities: legacy };
}
