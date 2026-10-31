import { test } from "node:test";
import assert from "node:assert/strict";
import { pipelineHints, type PipelineCounts } from "../lib/pipeline-health.ts";

const now = new Date("2026-10-31T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);
const healthy: PipelineCounts = {
  activeSources: 3,
  pending: 0,
  failed: 0,
  signals: 12,
  normalizedSignals: 12,
  clusterableSignals: 10,
  embeddedSignals: 10,
  aiConfigured: true,
  lastSyncAt: hoursAgo(2),
  lastExtractAt: hoursAgo(1),
};
const texts = (c: Partial<PipelineCounts>) => pipelineHints({ ...healthy, ...c }, now).map((h) => h.text).join("\n");

test("a healthy pipeline produces no hints", () => {
  assert.deepEqual(pipelineHints(healthy, now), []);
});

test("problems produce actionable hints", () => {
  assert.match(texts({ activeSources: 0 }), /Нет включённых источников/);
  assert.match(texts({ aiConfigured: false }), /AI-ключ не задан/);
  assert.match(texts({ failed: 4 }), /с ошибкой извлечения: 4.*Повторить неудачные/);
  assert.match(texts({ lastSyncAt: hoursAgo(72) }), /3 дн\. назад.*GitHub → Actions/);
  assert.match(texts({ lastSyncAt: null }), /ни разу не синхронизировались/);
  assert.match(texts({ pending: 12, lastExtractAt: hoursAgo(10) }), /В очереди 12/);
  assert.match(texts({ embeddedSignals: 7 }), /У 3 сигналов нет эмбеддингов/);
  assert.match(texts({ signals: 15 }), /вне группировки: 3/);
});

test("recent activity and missing AI do not produce misleading queue hints", () => {
  assert.equal(texts({ pending: 5, lastExtractAt: hoursAgo(1) }), "");
  assert.doesNotMatch(texts({ pending: 5, aiConfigured: false }), /В очереди/);
});
