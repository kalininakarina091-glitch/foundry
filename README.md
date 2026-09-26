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

## Data and validation limits

The UI reports missing information instead of inventing market size, timing,
competition or monetization. Existing database opportunities may have legacy
scores derived from generation confidence; they are displayed as preliminary
and are never used to assign BUILD. Newly generated opportunities keep their
supporting evidence and use the existing scoring heuristic independently.

Validation considers up to 40 linked materials. The baseline gate requires three
distinct raw items with claims and HTTP(S) source links from at least two source
records. This is a product guardrail, not statistical validation or proof of
independence. AI arguments must reference supplied evidence IDs; malformed answers
and invented IDs are rejected. A source link establishes provenance, not truth.
Existing signal relevance, grouping and scoring remain heuristics needing further
evaluation. Complaint signals are no longer automatically classified as negative.

Validation reports currently live only on the open page; history and persistent
confidence are not implemented. Authentication screens are prototypes, not access
control. This is a local MVP; do not expose its mutation APIs publicly before
adding authentication and authorization. AI provider calls and source ingestion
depend on external services. Next step: persist reports and generated research
fields with source references, and evaluate ingestion/relevance quality.
