// End-to-end HTTP checks against a running app and a disposable database.
// Seeds its own data, exercises real flows, removes what it created.
// Run: node --experimental-strip-types scripts/e2e.mjs
// Env: E2E_BASE_URL (localhost only), DATABASE_URL (localhost, or a host that
// contains E2E_ALLOWED_DB_HOST), E2E_ALLOW_MUTATIONS=1, optional CRON_SECRET
// (same value as the server), E2E_EXPECT_NO_AI=1 when the server has no AI key.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { hashId } from "../lib/traceability.ts";

const base = process.env.E2E_BASE_URL;
const dbHost = new URL(process.env.DATABASE_URL || "postgresql://x").hostname;
if (
  !base ||
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) ||
  process.env.E2E_ALLOW_MUTATIONS !== "1" ||
  !(
    ["localhost", "127.0.0.1"].includes(dbHost) ||
    (process.env.E2E_ALLOWED_DB_HOST && dbHost.includes(process.env.E2E_ALLOWED_DB_HOST))
  )
)
  throw new Error("Refusing: use a localhost app, a disposable database and E2E_ALLOW_MUTATIONS=1.");

const root = new URL("../", import.meta.url);
const { PrismaClient } = await import(new URL("generated/prisma/index.js", root).href);
const prisma = new PrismaClient();
const run = `e2e${Date.now()}`;
const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push(`PASS  ${name}`);
  } catch (e) {
    results.push(`FAIL  ${name}: ${e instanceof Error ? e.message : e}`);
  }
}
async function http(path, { method = "GET", body, cookie, origin = base } = {}) {
  const r = await fetch(base + path, {
    method,
    redirect: "manual",
    headers: {
      ...(origin ? { Origin: origin } : {}),
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: r.status, json, text, setCookie: r.headers.get("set-cookie") || "" };
}
const session = (res) => res.setCookie.split(";")[0];

// ---- seed: one source, three materials on different hosts, two traced opportunities
const created = { users: [], opportunities: [], signals: [], rawItems: [], source: null };
const quotes = [
  "I spend six hours every week matching orders between three marketplaces",
  "Is there a tool that reconciles refunds across sales channels automatically",
  "We still copy every order into a spreadsheet by hand each evening",
];
const urls = [
  `https://news.ycombinator.com/item?id=${run}1`,
  `https://www.reddit.com/r/smallbusiness/comments/${run}2`,
  `https://softwarerecs.stackexchange.com/questions/${run}3`,
];
async function seed() {
  await prisma.authThrottle.deleteMany();
  created.source = await prisma.source.create({
    data: { name: `E2E ${run}`, type: "rss", url: "https://hnrss.org/ask", status: "active", lastSyncedAt: new Date() },
  });
  for (let i = 0; i < 3; i++) {
    const raw = await prisma.rawItem.create({
      data: {
        sourceId: created.source.id,
        externalId: `${run}-${i}`,
        title: `Order reconciliation ${i}`,
        content: `Context. ${quotes[i]}. More text.`,
        url: urls[i],
        publishedAt: new Date(),
        extractionStatus: "extracted",
        metadata: JSON.stringify({ extraction: { materialKind: "solution_request" } }),
      },
    });
    created.rawItems.push(raw);
    created.signals.push(
      await prisma.signal.create({
        data: {
          rawItemId: raw.id,
          type: "pain",
          title: `Ручная сверка заказов ${i}`,
          description: quotes[i],
          normalizedProblem: "reconciling orders across sales channels",
          groupingKey: "reconciling orders across sales channels",
          strength: 0.8,
        },
      }),
    );
  }
  for (const members of [[0, 1], [0, 2]]) {
    const signals = members.map((i) => created.signals[i]);
    const ids = signals.map((s) => s.id);
    const opp = await prisma.opportunity.create({
      data: {
        title: `E2E сверка заказов ${members.join("")}`,
        description: "Владельцы магазинов вручную сверяют заказы между площадками.",
        industry: "tool",
        generationKey: hashId("pattern", ids),
        research: JSON.stringify({ target_customer: "Владельцы небольших магазинов", monetization_signal_ids: [] }),
        provenance: JSON.stringify({
          version: 1,
          pattern: { id: hashId("pattern", ids), clusterId: hashId("cluster", ids), signalIds: ids },
          signals: signals.map((s, k) => ({
            signalId: s.id,
            rawItemId: s.rawItemId,
            sourceId: created.source.id,
            url: urls[members[k]],
            quote: s.description,
            claim: s.title,
          })),
        }),
        evidence: {
          create: signals.map((s, k) => ({
            signalId: s.id,
            claim: s.title,
            evidenceType: "neutral",
            strength: 0.8,
            sourceUrl: urls[members[k]],
          })),
        },
      },
    });
    created.opportunities.push(opp);
  }
}
async function cleanup() {
  await prisma.user.deleteMany({ where: { email: { startsWith: `${run}-` } } });
  const oppIds = created.opportunities.map((o) => o.id);
  await prisma.validationRun.deleteMany({ where: { opportunityId: { in: oppIds } } });
  await prisma.evidence.deleteMany({ where: { opportunityId: { in: oppIds } } });
  await prisma.opportunity.deleteMany({ where: { id: { in: oppIds } } });
  await prisma.signal.deleteMany({ where: { id: { in: created.signals.map((s) => s.id) } } });
  await prisma.rawItem.deleteMany({ where: { id: { in: created.rawItems.map((r) => r.id) } } });
  if (created.source) await prisma.source.delete({ where: { id: created.source.id } });
}

const password = randomBytes(18).toString("base64url");
const A = { email: `${run}-a@example.test`, name: "E2E A" };
const B = { email: `${run}-b@example.test`, name: "E2E B" };
try {
  await seed();
  const [opp1, opp2] = created.opportunities;

  await step("anonymous: private API 401, pages redirect, cross-site POST 403", async () => {
    assert.equal((await http("/api/me/profile")).status, 401);
    assert.equal((await http("/dashboard")).status, 307);
    assert.equal((await http("/api/auth/login", { method: "POST", body: {}, origin: "https://evil.example.com" })).status, 403);
  });
  await step("registration: two accounts, safe cookie, duplicate refused", async () => {
    for (const u of [A, B]) {
      const r = await http("/api/auth/register", { method: "POST", body: { email: u.email, name: u.name, password } });
      assert.equal(r.status, 201, r.text);
      assert.match(r.setCookie, /HttpOnly/i);
      assert.match(r.setCookie, /SameSite=Lax/i);
      u.cookie = session(r);
    }
    assert.equal((await http("/api/auth/register", { method: "POST", body: { email: A.email, name: A.name, password } })).status, 409);
  });
  await step("profile, saved, feedback and decisions are isolated per user", async () => {
    const profile = { role: "developer", goals: ["saas"], industries: ["ecommerce"], businessTypes: ["tool"], budget: "micro", team: "solo", time: "part", skills: ["development"], markets: ["global"], onboardingStep: 5, onboardingCompleted: true, onboardingSkipped: false };
    assert.equal((await http("/api/me/profile", { method: "PUT", cookie: A.cookie, body: profile })).status, 200);
    assert.equal((await http("/api/me/profile", { cookie: B.cookie })).json.role, null);
    assert.equal((await http("/api/me/saved", { method: "PUT", cookie: A.cookie, body: { opportunityId: opp1.id, active: true } })).status, 200);
    assert.equal((await http("/api/me/feedback", { method: "PUT", cookie: A.cookie, body: { opportunityId: opp2.id, active: true } })).status, 200);
    const d = await http("/api/me/decisions", { method: "PUT", cookie: A.cookie, body: { opportunityId: opp1.id, status: "exploring", note: " проверить спрос " } });
    assert.equal(d.json?.note, "проверить спрос");
    const catA = (await http("/api/me/catalog", { cookie: A.cookie })).json;
    assert.deepEqual(catA.saved, [opp1.id]);
    assert.deepEqual(catA.dismissed, [opp2.id]);
    assert.equal(catA.decisions[opp1.id], "exploring");
    const catB = (await http("/api/me/catalog", { cookie: B.cookie })).json;
    assert.deepEqual([catB.saved, catB.dismissed, catB.decisions], [[], [], {}]);
    assert.equal((await http("/api/me/decisions", { method: "PUT", cookie: A.cookie, body: { opportunityId: opp1.id, status: null, note: "", userId: "x" } })).status, 400);
  });
  await step("pages render the score breakdown, decision panel, compare, plan and pipeline status", async () => {
    const page = await http(`/opportunities/${opp1.id}`, { cookie: A.cookie });
    assert.equal(page.status, 200);
    assert.match(page.text, /Из чего сложилась оценка/);
    assert.match(page.text, /Моё решение/);
    assert.match((await http(`/compare?ids=${opp1.id},${opp2.id}`, { cookie: A.cookie })).text, /Сравнение возможностей/);
    assert.match((await http(`/plan/${opp1.id}`, { cookie: A.cookie })).text, /Плана пока нет/);
    assert.match((await http("/signals", { cookie: A.cookie })).text, /Состояние pipeline/);
    assert.match((await http("/dashboard", { cookie: A.cookie })).text, /Что делать дальше/);
  });
  await step("validation with two materials is «insufficient» without calling the model", async () => {
    const r = await http("/api/validate", { method: "POST", cookie: A.cookie, body: { opportunityId: opp1.id } });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.recommendation, "RESEARCH MORE");
    assert.equal(r.json.confidence, 0);
    assert.equal(await prisma.validationRun.count({ where: { opportunityId: opp1.id } }), 0);
  });
  if (process.env.E2E_EXPECT_NO_AI === "1")
    await step("AI routes answer 503 when no provider key is configured", async () => {
      assert.equal((await http("/api/plan", { method: "POST", cookie: A.cookie, body: { opportunityId: opp1.id } })).status, 503);
    });
  await step("pipeline mutations are admin-only; an admin can normalize", async () => {
    assert.equal((await http("/api/signals/normalize", { method: "POST", cookie: A.cookie, body: {} })).status, 403);
    await prisma.user.update({ where: { email: A.email }, data: { isAdmin: true } });
    const r = await http("/api/signals/normalize", { method: "POST", cookie: A.cookie, body: {} });
    assert.equal(r.status, 200, r.text);
    await prisma.user.update({ where: { email: A.email }, data: { isAdmin: false } });
  });
  await step("scheduled pipeline endpoint requires the secret", async () => {
    const none = await http("/api/cron/pipeline", { method: "POST", origin: null });
    assert.ok([401, 503].includes(none.status), String(none.status));
    if (process.env.CRON_SECRET) {
      const r = await fetch(base + "/api/cron/pipeline", { method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
      assert.equal(r.status, 200, await r.text());
    }
  });
  await step("login: wrong password 401, per-email limit 429 does not lock other accounts", async () => {
    const victim = `${run}-nobody@example.test`;
    for (let i = 0; i < 10; i++)
      assert.equal((await http("/api/auth/login", { method: "POST", body: { email: victim, password: "wrong-password-1" } })).status, 401);
    assert.equal((await http("/api/auth/login", { method: "POST", body: { email: victim, password: "wrong-password-1" } })).status, 429);
    assert.equal((await http("/api/auth/login", { method: "POST", body: { email: A.email, password } })).status, 200);
  });
  await step("password change ends other sessions; old password stops working", async () => {
    const other = session(await http("/api/auth/login", { method: "POST", body: { email: A.email, password } }));
    assert.equal((await http("/api/me/password", { method: "PUT", cookie: A.cookie, body: { current: "nope", next: "x".repeat(14) } })).status, 403);
    const next = `${password}-new`;
    assert.equal((await http("/api/me/password", { method: "PUT", cookie: A.cookie, body: { current: password, next } })).status, 200);
    assert.equal((await http("/api/me/profile", { cookie: other })).status, 401);
    assert.equal((await http("/api/me/profile", { cookie: A.cookie })).status, 200);
    assert.equal((await http("/api/auth/login", { method: "POST", body: { email: A.email, password } })).status, 401);
  });
  await step("account deletion removes the user's personal data", async () => {
    await http("/api/me/decisions", { method: "PUT", cookie: B.cookie, body: { opportunityId: opp2.id, status: "rejected", note: "нет" } });
    const r = await http("/api/me/delete", { method: "POST", cookie: B.cookie, body: { password, confirm: "удалить" } });
    assert.equal(r.status, 200, r.text);
    assert.equal((await http("/api/me/profile", { cookie: B.cookie })).status, 401);
    assert.equal(await prisma.opportunityDecision.count({ where: { opportunityId: opp2.id } }), 0);
  });
  await step("logout ends the session", async () => {
    assert.equal((await http("/api/auth/logout", { method: "POST", cookie: A.cookie, body: {} })).status, 200);
    assert.equal((await http("/api/me/profile", { cookie: A.cookie })).status, 401);
  });
} finally {
  await cleanup().catch((e) => results.push(`FAIL  cleanup: ${e.message}`));
  await prisma.$disconnect();
}
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
