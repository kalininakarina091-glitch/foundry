# Foundry

Evidence-first workspace for discovering and validating business opportunities.
Built with Next.js App Router, React, Tailwind CSS and Prisma 6 / SQLite.

## Run locally

Use Node.js 22.18+ (24 recommended).

```sh
npm ci
npm run db:setup
npm run dev
```

`db:setup` generates the Prisma client and applies the existing SQLite migrations;
it does not reset an existing database. Copy `.env.example` to `.env.local` and set
`OPENROUTER_API_KEY` for AI operations. No key is needed to browse records, explore
demo examples, or receive an insufficient-evidence result. Optionally seed source
definitions with `node --experimental-strip-types prisma/seed.ts`.

The default database is `prisma/dev.db`. `DATABASE_URL` can override it at runtime
(use an absolute `file:` URL for isolated tests). Database files and credentials
are ignored by Git. No records or secrets are included in the repository.

## Product flow

- `/dashboard`: recent database opportunities and counts derived from their evidence.
- `/opportunities`: the same records, with search, category filters and sorting.
- `/opportunities/:id`: problem, customer, evidence provenance and research gaps.
- `/validation/:id`: evidence-based recommendation and confidence, separate from Score.
- `/settings`: provider configuration status and links to existing data preparation tools.

`?mode=demo` explicitly selects the fixtures in `lib/mock-data.ts` on the list,
details and validation pages. Demo examples never silently replace failed database
requests, create database records or call the validation provider. `/insights`
redirects to `/opportunities`. Existing sources, signals, clusters, patterns and
evidence routes are retained. Legacy reports, team, alerts, simulator and integration
screens are marked as demonstrations and excluded from primary navigation.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

For desktop environments that cannot spawn child processes, use the supported
Next.js thread/API mode (PowerShell):

```powershell
$env:FOUNDRY_BUILD_THREADS = '1'
node node_modules/next/dist/bin/next build --webpack
node --experimental-strip-types --test --test-isolation=none tests/*.test.ts
```

This mode still performs TypeScript checking. It does not ignore build errors.

## Pipeline and evidence limits

Source → RawItem → Signal → Normalize → Cluster → Pattern → Opportunity → Score → Evidence → Validation now retains exact member IDs and source quotes. Generate with POST /api/opportunities/generate and a patternId from /api/patterns. Old keyword-based clusterName generation and arbitrary /api/analyze input are no longer supported.

Only signals with public non-placeholder URLs, exact source quotes and matching generation provenance contribute to an opportunity. Legacy hypotheses remain visible with a warning; their unsupported evidence and old stored scores are excluded. Score is a transparent evidence-support heuristic (material count, publication-host diversity, model-assigned signal strength), not market attractiveness, growth, revenue or success probability.

Validation considers up to 40 materials and returns their snapshot. BUILD requires at least three distinct materials across two source records and two publication hosts in the positively cited subset, plus the model's verdict/confidence gate. These are conservative product guardrails, not statistical proof of independence or demand. Reports are not persisted beyond the open page.

GitHub imports 15 recent open issues (optionally scoped to a repository); Hacker News imports 15 top story records, not linked articles or comment threads; RSS reads the configured feed. Source creation is currently available through POST /api/source. A legacy RSS source pointing to example.com must be replaced with a real feed configuration; it will now report an error instead of importing unrelated fixed feeds. Failed extractions can be retried through POST /api/signals/extract with rawItemId. Batch extraction handles pending records only.

Email/password authentication and database-backed sessions are implemented. Profile, preferences, Saved and feedback belong to the signed-in user. Market records remain shared; pipeline mutations require an administrator. Scheduled jobs, notifications and remote integrations are not implemented. Source documents are untrusted and AI extraction/generation can still misjudge relevance or combine different problems. No automated rule establishes willingness to pay.

## Accounts and personalization

Register at `/signup`, complete the six-step onboarding, or skip with limited personalization. Edit all answers at `/settings/personalization`. `/opportunities?view=for-you` ranks the common catalog using a separate deterministic Match Score; `?view=all` keeps the common market ranking. Match Score never changes Opportunity Score, evidence or Validation Confidence.

Apply migrations and regenerate Prisma before starting this version. Outside localhost, set the canonical `APP_ORIGIN` and serve through HTTPS. New accounts are ordinary users; administrator privileges must be assigned by a trusted database operator, never by registration or profile fields. Email verification, password reset, OAuth and MFA are not implemented. Do not use this MVP as a public production identity service without deployment/security review.

See [accounts architecture and final QA](docs/ACCOUNTS-PERSONALIZATION-QA.md) for the schema, algorithm, checks and remaining limitations. Historical audit reports below describe their original revision.

## Audit and repeatable QA

See [the technical audit](docs/TECHNICAL-AUDIT-2026-09-27.md) and [recorded API checks](docs/audit/e2e-2026-09-27.json).

For isolated production QA, migrate a **copy** of the database with a temporary Prisma schema pointing to that copy. DATABASE_URL overrides the application runtime, not the hardcoded default in the Prisma CLI schema. Set FOUNDRY_AUDIT_BUILD=1 for both build and start to use .next-audit without replacing .next. Apply the new additive migration before starting this version, and regenerate the local client with npm run db:setup for the default database.

The regression script deliberately clears/restores evidence on a selected audit-created opportunity. Run only on a disposable database with no concurrent writes:

```powershell
$env:QA_BASE_URL='http://127.0.0.1:3109'
$env:QA_OPPORTUNITY_ID='<ID generated on the audit copy>'
$env:QA_ALLOW_MUTATIONS='1'
$env:QA_SESSION_COOKIE='<session of a QA administrator on the disposable copy>'
node scripts/qa-pipeline.mjs
```

It verifies lineage, normalization/generation/extraction idempotency, score reset/restoration, validation guards, invalid requests and page HTTP responses. Live ingestion and first-time AI generation/extraction require network access and provider credentials; their recorded outcomes are separate from deterministic unit tests.
