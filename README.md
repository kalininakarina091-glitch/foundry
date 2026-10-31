# Foundry

Evidence-first workspace for finding and validating business opportunities.
Foundry collects public posts where people describe a problem or look for a
solution, extracts signals with exact quotes, groups recurring problems, forms
opportunity hypotheses and validates them against evidence. Principle: **a
signal is not an opportunity** — with too little evidence Foundry says so.

Next.js (App Router) · React · TypeScript · Tailwind CSS · Prisma 6 ·
PostgreSQL (Neon) · Netlify · OpenRouter (language models and embeddings) ·
GitHub Actions (checks and the hourly pipeline).

## Product

User path: **Discover → Understand → Validate → Decide**, in Russian UI.

| Page | Purpose |
| --- | --- |
| `/` | Public landing; signed-in users go to the dashboard |
| `/dashboard` | Counts, «Что делать дальше» (next steps from the user's decisions, plans and profile), opportunity table |
| `/opportunities` | Catalog: «Для вас» (Match Score), all, saved, «Мои решения»; compare up to three |
| `/opportunities/:id` | Problem, customer, evidence with sources and quotes, score breakdown, «Моё решение» |
| `/validation/:id` | Model-backed validation with history; insufficient evidence is answered without the model |
| `/plan/:id` | Business Builder: personal plan to test an opportunity cheaply |
| `/compare?ids=` | Side-by-side comparison; scores stay separate |
| `/settings` | Profile, preferences, «Безопасность» (password, sessions, data export, account deletion) |
| `/sources`, `/signals`, `/patterns` | Pipeline tools and status — administrators |
| `/admin/users` | Accounts and administrator rights — administrators |

### Three scores that are never mixed

- **Opportunity Score** (`lib/opportunity-score.ts`): evidence (35), demand (25),
  recency (15), stated spending (25). A dimension without data is excluded, not
  zero; coverage shows how much was measured. Competitors and market size are
  not scored — there is no verifiable data. Same for every user.
- **Validation Confidence** (`lib/validation.ts`): how well evidence supports the
  verdict, not a probability of success. BUILD requires at least three
  materials from two sources and two hosts among positively cited evidence.
- **Match Score** (`lib/personalization.ts`): deterministic fit to the user's
  profile; unknown factors are listed, not counted as a match. Personal, never
  changes market data.

### Pipeline

Source → RawItem → Signal → Normalize → Cluster/Pattern → Opportunity → Evidence → Validation.

- Connectors: RSS/Atom (incl. phrase searches on Hacker News and Reddit,
  Stack Exchange), GitHub issues, Hacker News top. A link already imported by
  any source is skipped.
- Extraction (`lib/ai.ts`, `lib/signal-gate.ts`): the model classifies the
  material; only «own problem» and «solution request» with a stated pain or
  customer become signals. The quote must occur in the source text (HTML is
  read as text). Failure reasons are stored; provider-side failures return the
  material to the queue.
- Clustering (`lib/traceability.ts`, `lib/semantic.ts`): complete link on
  embeddings of an English task phrase with per-model calibrated thresholds;
  word overlap is the fallback.
- Generation never duplicates a problem: a grown pattern extends the existing
  opportunity. Provenance (pattern hash, signal ids, quotes, URLs) is verified
  on every read.
- Hourly scheduler: `.github/workflows/pipeline-schedule.yml` calls
  `POST /api/cron/pipeline` with `CRON_SECRET`; each run syncs the most overdue
  source (daily) or extracts two pending materials.

## Run locally

Node.js 24.

```sh
npm ci
cp .env.example .env.local   # set DATABASE_URL (a non-production database) and OPENROUTER_API_KEY
npm run db:setup             # generate client and apply migrations
npm run dev
```

Make an account at `/signup`; administrator rights are granted by an existing
administrator at `/admin/users` (the very first one with SQL:
`UPDATE "User" SET "isAdmin" = true WHERE email = '…'`).

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | runtime | PostgreSQL (pooled). Production and deploy previews use different Neon branches |
| `DIRECT_URL` | migrations only | Unpooled URL; npm scripts fall back to `DATABASE_URL` |
| `APP_ORIGIN` | production | Canonical HTTPS origin |
| `OPENROUTER_API_KEY` | runtime | AI extraction, generation, validation, plans, embeddings |
| `OPENROUTER_MODEL` | optional | Default `meta-llama/llama-3.3-70b-instruct` |
| `OPENROUTER_EMBEDDING_MODEL` | optional | Default `openai/text-embedding-3-small` |
| `CRON_SECRET` | runtime + GitHub secret | ≥ 32 characters; without it the scheduled endpoint refuses calls |
| GitHub variable `APP_ORIGIN` | Actions | Site the hourly workflow calls |

Every AI call states `max_tokens`; OpenRouter otherwise reserves the model's
full output limit against the balance.

## Database and deployment

- Schema: `prisma/schema.prisma`; migrations in `prisma/migrations`. Apply new
  migrations to the preview and production Neon branches **before** deploying
  code that needs them (additive migrations keep older code working).
- Netlify builds `main` (`npm run netlify:build`); deploy previews for PRs.
  The free plan includes 300 credits per month and a production deploy costs
  15, so publish once per block of work. GitHub events can reach Netlify late
  and out of order: after a merge, check that the published deploy is the
  latest `main` commit.
- SQLite import and the original PostgreSQL release procedure:
  [docs/POSTGRES-PRODUCTION.md](docs/POSTGRES-PRODUCTION.md).

## Checks

```sh
npm run lint
npm run typecheck
npm test        # unit tests (node:test)
npm run build
E2E_BASE_URL=http://localhost:3000 E2E_ALLOW_MUTATIONS=1 npm run e2e
```

`npm run e2e` seeds and removes its own data and runs real HTTP flows
(accounts and isolation, decisions, pages, insufficient-evidence validation,
admin boundary, scheduler secret, login limits, password change, deletion). It
refuses non-local apps and databases unless `E2E_ALLOWED_DB_HOST` names a
disposable host. CI runs all of the above on every PR against a PostgreSQL
service with no AI key.

## Limits

- Signals come from public posts and AI can misjudge relevance; quotes and
  links let every conclusion be checked by hand.
- No automated rule establishes willingness to pay; spending is counted only
  when a source states it.
- Email verification, password reset by email, OAuth and MFA are not
  implemented.
- Recommendations support decisions; they do not guarantee commercial success.

Historical reports in `docs/` describe the project at their dates.
