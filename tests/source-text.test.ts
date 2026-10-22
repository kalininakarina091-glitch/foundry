import { test } from "node:test";
import assert from "node:assert/strict";
import { htmlToText, quoteInSource, sourceDocument } from "../lib/source-text.ts";
import { isTraceableSignal, normalizeText, type PipelineSignal } from "../lib/traceability.ts";
import { AIError, failureLabel, failureOf } from "../lib/ai-errors.ts";

// Shape of a real Hacker News `text` field: HTML paragraphs and entities.
const hnText =
  "I run a small bakery and I&#x27;m spending 6 hours every week reconciling orders from three apps.<p>Is there a tool that merges them? &quot;Export to CSV&quot; doesn&#x27;t help.";
const hn = { title: "Ask HN: Order reconciliation for small shops?", content: hnText, source: { type: "hackernews" } };

test("HTML from feeds becomes plain readable text", () => {
  assert.equal(
    htmlToText(hnText),
    "I run a small bakery and I'm spending 6 hours every week reconciling orders from three apps.\nIs there a tool that merges them? \"Export to CSV\" doesn't help.",
  );
  assert.equal(htmlToText("a&amp;lt;b &#128512; <a href=\"x\">link</a><br>next"), "a&lt;b 😀 link\nnext");
  assert.equal(htmlToText("<script>alert(1)</script>safe"), "safe");
});

test("markdown sources are not rewritten, so code like Vec<String> survives", () => {
  const github = { title: "Bug", content: "Parsing Vec<String> fails &amp; crashes", source: { type: "github" } };
  assert.equal(sourceDocument(github), "Bug\nParsing Vec<String> fails &amp; crashes");
  assert.equal(htmlToText("x < y and y > z"), "x < y and y > z");
});

test("a model quote of the readable text is traceable to the stored HTML", () => {
  assert.equal(quoteInSource("I'm spending 6 hours every week reconciling orders", hn), true);
  assert.equal(quoteInSource('"Export to CSV" doesn\'t help.', hn), true);
  // A line break in the source may be quoted as a space.
  assert.equal(quoteInSource("from three apps. Is there a tool that merges them?", hn), true);
  // Quotes copied verbatim from the stored HTML keep working for existing signals.
  assert.equal(quoteInSource("I&#x27;m spending 6 hours", hn), true);
});

test("altered, invented or too short quotes are still rejected", () => {
  assert.equal(quoteInSource("I am spending 6 hours every week reconciling orders", hn), false);
  assert.equal(quoteInSource("i'm spending 6 hours every week reconciling orders", hn), false);
  assert.equal(quoteInSource("Customers would pay $50 per month for this", hn), false);
  assert.equal(quoteInSource("6 hours", hn), false);
  assert.equal(quoteInSource(null, hn), false);
});

test("pipeline traceability accepts an HTML-sourced signal with a readable quote", () => {
  const quote = "I'm spending 6 hours every week reconciling orders from three apps.";
  const signal: PipelineSignal = {
    id: "s1",
    title: "Small shops reconcile orders by hand",
    description: quote,
    normalizedProblem: normalizeText("Small shops reconcile orders by hand"),
    customer: null,
    industry: null,
    type: "pain",
    strength: 0.7,
    createdAt: new Date(),
    duplicateOf: null,
    rawItem: {
      id: "r1",
      url: "https://news.ycombinator.com/item?id=1",
      title: hn.title,
      content: hnText,
      sourceId: "src-hackernews",
      publishedAt: null,
      source: { id: "src-hackernews", name: "Hacker News", type: "hackernews" },
    },
  };
  assert.equal(isTraceableSignal(signal), true);
  assert.equal(isTraceableSignal({ ...signal, description: "I am spending six hours on orders" }), false);
});

test("extraction failures are classified without leaking provider details", () => {
  assert.deepEqual(failureOf(new AIError("provider_http", 429)), { reason: "provider_http", httpStatus: 429 });
  assert.deepEqual(failureOf(new AIError("quote_not_found")), { reason: "quote_not_found" });
  assert.deepEqual(failureOf(new Error("sk-or-v1-secret in message")), { reason: "unknown" });
  assert.equal(failureLabel("quote_not_found"), "Цитата модели не найдена в исходном тексте");
  assert.equal(failureLabel("__proto__"), "Неизвестная ошибка");
  assert.equal(failureLabel(undefined), "Неизвестная ошибка");
});

test("credit and rate-limit failures get actionable reasons", async () => {
  const { httpFailure } = await import("../lib/ai-errors.ts");
  assert.deepEqual(failureOf(httpFailure(402)), { reason: "provider_credits", httpStatus: 402 });
  assert.deepEqual(failureOf(httpFailure(429)), { reason: "provider_rate_limit", httpStatus: 429 });
  assert.deepEqual(failureOf(httpFailure(500)), { reason: "provider_http", httpStatus: 500 });
  assert.equal(failureLabel("provider_credits"), "Недостаточно кредитов OpenRouter");
});

test("only provider-side failures return a material to the queue", async () => {
  const { isProviderSide } = await import("../lib/ai-errors.ts");
  for (const r of ["provider_rate_limit", "provider_credits", "provider_timeout", "provider_unavailable", "provider_http"])
    assert.equal(isProviderSide(r), true, r);
  for (const r of ["invalid_json", "invalid_schema", "quote_not_found", "unknown"])
    assert.equal(isProviderSide(r), false, r);
});
