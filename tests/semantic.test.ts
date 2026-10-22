import { test } from "node:test";
import assert from "node:assert/strict";
import { cosine, decodeEmbedding, encodeEmbedding } from "../lib/semantic.ts";
import { groupSignals, normalizeText, type PipelineSignal } from "../lib/traceability.ts";

function signal(id: string, problem: string, vector?: number[], model = "m1"): PipelineSignal {
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
    embedding: vector ? encodeEmbedding(model, vector) : null,
    rawItem: {
      id: `raw-${id}`,
      url: `https://news.ycombinator.com/item?id=${id}`,
      content: problem,
      sourceId: "hn",
      publishedAt: null,
      source: { id: "hn", name: "Ask HN", type: "rss" },
    },
  };
}

test("embeddings round-trip and reject malformed values", () => {
  const stored = decodeEmbedding(encodeEmbedding("m1", [0.1234567891, -1, 0]));
  assert.deepEqual(stored, { model: "m1", v: [0.123457, -1, 0] });
  for (const bad of [null, "", "{", '{"model":"m1","v":[]}', '{"model":"m1","v":["x"]}', '{"v":[1]}'])
    assert.equal(decodeEmbedding(bad), null);
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([1, 0], [1, 0, 0]), 0);
});

test("paraphrases with no shared words group by meaning", () => {
  const a = signal("1", "reconciling orders across sales channels", [1, 0.1, 0]),
    b = signal("2", "matching marketplace purchases by hand", [0.9, 0.2, 0]),
    c = signal("3", "preparing hair before braiding", [0, 0, 1]);
  const groups = groupSignals([a, b, c]);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].members.map((s) => s.id), ["1", "2"]);
  assert.equal(groups[0].method, "semantic");
  assert.ok(groups[0].cohesion > 0.9);
});

test("semantic complete link still blocks a bridge between unrelated problems", () => {
  const groups = groupSignals([
    signal("1", "first problem", [1, 0, 0]),
    signal("2", "bridge problem", [0.75, 0.66, 0]),
    signal("3", "other problem", [0, 1, 0]),
  ]);
  assert.deepEqual(groups.map((g) => g.members.map((s) => s.id)), [["1", "2"]]);
});

test("vectors of different models are never compared; words are used instead", () => {
  const groups = groupSignals([
    signal("1", "export accessible audit reports", [1, 0], "m1"),
    signal("2", "export accessible audit reports", [0, 1], "m2"),
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].method, "lexical");
  const unrelated = groupSignals([
    signal("1", "export accessible audit reports", [1, 0], "m1"),
    signal("2", "irrigation weather forecasts", [1, 0], "m2"),
  ]);
  assert.equal(unrelated.length, 0);
});
