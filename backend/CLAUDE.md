# Mindshift simulation backend

Career/entrepreneurship simulation platform. Decision-based simulation: 12 "missions", each with
5 sequential decisions, each decision has 4 choices, choices move 7 underlying metrics that
determine outcomes.

## Stack & architecture

- Backend: NestJS + TypeScript
- Frontend: Next.js, in `../frontend` — separate concern, pure view layer, only calls this API,
  **never talks to the DB directly**
- ORM: Drizzle
- DB: PostgreSQL
- Style: **layered/n-tier, not MVC**. Chain:

  ```
  Next.js (view) -> NestJS Controllers -> Services -> Repositories (Drizzle) -> PostgreSQL
  ```

  - Controllers: HTTP routing + validation only. No business logic.
  - Services: all business logic lives here.
  - Services avoid touching Drizzle directly where possible — go through repository-style query
    functions so services stay unit-testable without a live DB.
- Config: `@nestjs/config` (`ConfigService`), not raw `process.env` reads scattered through code.

## Module ownership

| Module | Owner | Scope | Status |
|---|---|---|---|
| `db/schema.ts` | shared foundation | all 8 tables (definitions only) | done |
| DB instance setup + migrations | **teammate** | creating the Postgres role/db, `drizzle.config.ts`, running/applying migrations | **not started — see "Database setup" below** |
| `MissionsModule` | — | `GET /missions`, `GET /missions/:missionId` | done (needs a running DB + applied migrations to actually work) |
| `PlaythroughsModule` | — | `POST /playthroughs`, `GET /playthroughs`, `GET /playthroughs/:id`, `GET /playthroughs/:id/comparison`, `POST /playthroughs/:id/reset` | done (needs a running DB + applied migrations to actually work) |
| `AttemptsModule` | teammate | mission attempt + decision flow | not started |
| `UsersModule` / auth | teammate | placeholder `users` table now, real auth later | not started |

**Note:** DB instance setup/migrations were previously done in this session, then intentionally
undone (tables dropped, `drizzle.config.ts` and the `drizzle/` migration folder deleted) once it
turned out that work was assigned to the teammate on GitHub, not part of this scope.
`db/schema.ts` and `db/db.module.ts` were kept, since `MissionsModule`/`PlaythroughsModule` need
them to compile — but there is currently **no live database and no migrations**. See "Database
setup" below for how to stand it back up.

Playthroughs hands off to Attempts: `POST /playthroughs/:playthroughId/missions/:missionId/attempts`
lives in AttemptsModule but is nested under a playthrough — keep that FK relationship (`mission_attempts.playthrough_id`)
in mind when working across the boundary.

## Database schema (8 tables) — full field-level spec

All PKs are `uuid` with a generated default (Postgres `gen_random_uuid()`) — **never**
`serial`/auto-increment. This was an explicit call: auto-increment IDs were judged likely to cause
bugs later (e.g. across environments/merges).

**`users`** (placeholder — will likely be swapped for real auth later, don't over-invest)

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| email | varchar | unique |
| password_hash | varchar | |
| display_name | varchar | nullable |
| created_at | timestamp | |

**`missions`** (content, static, read-only at runtime)

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| order_index | int | 1–12 |
| title | varchar | |
| category | varchar | |
| description | text | |
| manager_note | text | static per mission, shown across all 5 decisions |
| manager_name | varchar | |
| goal_text | text | |
| created_at | timestamp | |

**`decisions`** (content, static, read-only at runtime)

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| mission_id | uuid, FK → missions | |
| order_index | int | 1–5 within the mission |
| stage_label | varchar | |
| prompt_text | text | |
| context_text | text | |
| created_at | timestamp | |

**`characters`** (content, static, read-only at runtime)

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| decision_id | uuid, FK → decisions | |
| name | varchar | |
| role | varchar | |
| message | text | this decision's specific line for this character |
| order_index | int | render order within the decision when multiple characters appear |
| created_at | timestamp | |

One row per character-*appearance*-in-a-decision, not a shared roster reused across missions by a
stable id — if the same character appears in two different missions, that's two separate rows
with duplicated name/role. Deliberate: avoids a join table, and the duplication is harmless since
this is static editorial content, not user data.

**`choices`** (content, static, read-only at runtime)

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| decision_id | uuid, FK → decisions | |
| label_key | char(1) | A/B/C/D |
| label_text | varchar | |
| metric_deltas | json | 7 keys: `customerTrust`, `complianceSafety`, `dataProtection`, `decisionQuality`, `accountability`, `reputationRisk`, `responsibleBanking` |
| created_at | timestamp | |

**`playthroughs`** (activity — one row per full 12-mission run)

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → users | |
| run_number | int | 1, 2, 3... per user |
| status | enum | `in_progress` \| `completed` \| `abandoned` |
| final_metrics | json | 7-metric totals across all 12 missions |
| profile_result | varchar | nullable |
| started_at | timestamp | |
| completed_at | timestamp | nullable |

**`mission_attempts`** (activity)

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| playthrough_id | uuid, FK → playthroughs | |
| mission_id | uuid, FK → missions | |
| status | enum | `in_progress` \| `completed` |
| final_metrics | json | nullable |
| mission_score | int | nullable |
| started_at | timestamp | |
| completed_at | timestamp | nullable |

**`decision_responses`** (activity)

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| attempt_id | uuid, FK → mission_attempts | |
| decision_id | uuid, FK → decisions | |
| choice_id | uuid, FK → choices | |
| answered_at | timestamp | |

Unique constraint on `(attempt_id, decision_id)` — enforces the forward-only/no-duplicate-answer
rule at the DB level, as a backstop to the service-layer check.

## Database setup (for whoever picks this up — currently no live DB)

Assumes a local Postgres server is already running (check with `pg_isready -h localhost -p 5432`).

1. **Create a role + database.** Run as an account that can `sudo -u postgres psql` (adjust the
   password if you want something other than the placeholder below):

   ```sql
   CREATE ROLE mindshift WITH LOGIN PASSWORD 'mindshift_dev' CREATEDB;
   CREATE DATABASE mindshift OWNER mindshift;
   ```

2. **Add `backend/.env`** (gitignored, copy from `.env.example` and adjust if you used different
   credentials above):

   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=mindshift
   DB_PASSWORD=mindshift_dev
   DB_NAME=mindshift
   ```

3. **Recreate `drizzle.config.ts`** (deleted along with the migration folder — `db/schema.ts` is
   still there and is what this config points at):

   ```ts
   import { defineConfig } from 'drizzle-kit';
   import * as dotenv from 'dotenv';

   dotenv.config();

   export default defineConfig({
     schema: './src/db/schema.ts',
     out: './drizzle',
     dialect: 'postgresql',
     dbCredentials: {
       host: process.env.DB_HOST ?? 'localhost',
       port: Number(process.env.DB_PORT ?? 5432),
       user: process.env.DB_USER ?? 'postgres',
       password: process.env.DB_PASSWORD ?? 'postgres',
       database: process.env.DB_NAME ?? 'mindshift',
     },
   });
   ```

4. **Generate the migration** from the existing schema:

   ```
   npx drizzle-kit generate
   ```

5. **Apply it.** `npx drizzle-kit migrate` hung / exited 1 with no error message in this
   environment during earlier setup — if you hit the same thing, apply the generated SQL file
   directly instead:

   ```
   PGPASSWORD=mindshift_dev psql -h localhost -U mindshift -d mindshift -f drizzle/000X_xxx.sql
   ```

6. Verify with `PGPASSWORD=mindshift_dev psql -h localhost -U mindshift -d mindshift -c "\dt"` —
   should list all 8 tables.

## Key business rules — decided, do not relitigate

1. **Forward-only navigation.** Within a `mission_attempt`, decisions must be answered in order.
   Out-of-sequence or re-answering an already-answered decision → `409 Conflict`.
2. **Live recompute, never incremental.** After every `decision_response` insert, running metrics
   for that attempt are recomputed by **summing `metric_deltas` across all responses in that
   attempt so far** — never an incremental add. This is deliberate so retried/out-of-order
   requests can't corrupt state.
3. **Situation pressure is derived, not stored.** No pressure column or table. It's a pure
   function: `calculatePressure(runningMetrics) -> { score, tier }`, a weighted combination of the
   7 running metrics. Weights live in one config object so they're easy to tune later.
4. **No risk tags on choices** — deliberately dropped vs. the reference prototype this was based on.
5. **Never send `metric_deltas` to the frontend before a choice is answered.**
6. **History/comparison is derived, not stored.** A join on `user_id` + `run_number`, diffing
   `final_metrics` at the playthrough level and `mission_score`/`final_metrics` per `mission_id`
   at the mission_attempts level. No snapshot/history table.
7. **No `simulations` table / `simulation_id` column yet** — only one simulation exists today.
   This is a deliberate, low-cost-to-add-later omission, not an oversight. Don't add it
   speculatively.

## API spec (finalized)

### Missions (read-only)

- `GET /missions` — list summary: id, orderIndex, title, category, description
- `GET /missions/:missionId` — full detail. Response key for the decisions is **`steps`** (not
  `decisions` — matches `docs/api-design-final.md`, which is authoritative for this endpoint's
  shape). Each step includes nested `choices` (label only, **no deltas**) and nested `characters`
  (name, role, message, orderIndex). The DB table itself is still named `decisions` — this is an
  API-response-naming choice only, not a table rename.

### Playthroughs (implemented — `backend/src/playthroughs/`)

- `POST /playthroughs` — start a new playthrough for the current user. Auto-resumes an existing
  `in_progress` playthrough instead of creating a duplicate (`200`); a genuinely new playthrough
  returns `201` with `runNumber` incremented from the user's last run.
- `GET /playthroughs` — list current user's playthroughs, most recent first
- `GET /playthroughs/:playthroughId` — full detail incl. its mission_attempts summary
- `GET /playthroughs/:playthroughId/comparison` — diff against previous **completed**
  playthrough (`metricDeltas`, `profileChanged`, `perMissionDeltas`). Null-shaped fields if
  there's no previous completed playthrough.
- `POST /playthroughs/:playthroughId/reset` — sets `status` to `abandoned`. Does **not** delete
  the row — it stays in history for the comparison endpoint. The next `POST /playthroughs` call
  starts a fresh run.

No auth exists yet, so the controller currently reads the acting user from a hardcoded
`PLACEHOLDER_USER_ID` constant in `playthroughs.controller.ts` rather than a validated token.
Swap that for a real `@CurrentUser()`/guard once auth lands — every service/repository call site
already takes `userId` as a plain parameter, so the swap is localized to the controller.

### Mission Attempts (teammate's module — not built by me, kept here so Playthroughs integrates
cleanly; names below corrected to match `docs/api-design-final.md` exactly)

- `POST /playthroughs/:playthroughId/missions/:missionId/attempts` — start/resume an attempt.
  Auto-resumes an `in_progress` attempt for this user+mission+playthrough; only creates a new one
  (replay) once the previous is `completed`.
- `GET /attempts/:attemptId/current-step` — the next unanswered step + running metrics so far.
  Exists specifically for the "reopen the app after leaving mid-mission" case — nothing is
  tracked client-side, so the frontend needs a way to ask "where was I?" on load.
- `POST /attempts/:attemptId/decisions` — submit `{ stepId, choiceId }`. Forward-only; out-of-order
  or duplicate submission → `409 Conflict`. Returns updated running metrics + `isMissionComplete`,
  deliberately **without** the full debrief inline (that's its own re-fetchable endpoint below).
- `GET /attempts/:attemptId/report` — full debrief for a completed attempt: score, verdict label,
  final/delta metrics, and a per-decision breakdown with `outcomeLabel`/`explanationText`. This is
  the **only** place outcome/explanation text is ever exposed, and only once the mission is fully
  committed — deliberately withheld everywhere upstream so it can't bias in-progress choices.

### Progress — NOT in scope for me, not yet built by anyone

- `GET /playthroughs/:playthroughId/progress` — lightweight per-mission done/not-done flags +
  `lastAttemptId`, for the Mission Hub checkmarks. Kept separate from the full profile so that
  screen doesn't have to load full 7-metric data just to draw checkmarks.

### Profile — NOT in scope for me, not yet built by anyone

- `GET /playthroughs/:playthroughId/profile` — aggregate report for one playthrough: overall
  score, profile label/description, per-mission scores, behavioral patterns. Always computed live
  by summing/deriving from that playthrough's completed attempts — never independently stored, so
  it can't go stale relative to the underlying decisions.

### Cross-cutting

- All `/playthroughs` and `/attempts` routes require auth and are scoped to the requesting user —
  never trust a user id passed in the request body/query.
- `metric_deltas`, `outcome_label`, and `explanation_text` are never sent to the client before an
  answer is submitted for that specific step; they ARE shown afterward via the report — that's
  intentional, not an inconsistency.
- Running/final metrics and mission/playthrough scores are always computed server-side from stored
  decision deltas, recomputed from source on every read — never trusted from the client, never
  patched incrementally. This keeps results correct under retried/out-of-order requests.
- Starting an attempt or playthrough auto-resumes an existing in-progress one rather than erroring
  or duplicating — "start over" (`reset`) is an explicit separate action, not a fork presented
  up front.

## A note on `docs/api-design-final.md`

**Updated 2026-08-23 (second update) — supersedes previous versions of this note.** This doc is
authoritative for endpoint naming/shape/scope, confirmed by the project owner — not just for
Missions naming as an earlier version of this note claimed. Implemented from it so far: Missions'
`steps`/`characters` response shape, and all 5 Playthroughs endpoints including
`POST /playthroughs/:id/reset`.

Still **not** part of the current build scope: `/progress`, `GET /playthroughs/:id/profile`, and
a standalone `ProfileModule` — those weren't requested yet, not a deliberate exclusion. If another
gap between this file and the doc turns up, re-check the doc directly and ask the project owner
rather than assuming based on this file's characterization of scope — it's been revised twice
already as more of the doc turned out to be in scope.

## Working conventions

- Controllers do HTTP + validation (DTOs, pipes) only.
- Services hold business logic and are the only place that should reason about business rules
  above.
- Services call repository-style functions for DB access rather than importing Drizzle query
  builders directly, so services stay unit-testable.
- **Repository and service methods mirror the module's endpoint count 1:1** — one method per
  route, no extra fine-grained query methods exposed beyond what that endpoint needs. The
  repository method does all necessary DB composition internally (joins, batched `inArray`
  queries to avoid N+1s, etc.); the service method adds business logic on top (404s, diffing/
  reshaping already-fetched rows into the response shape). See `MissionsRepository`/
  `PlaythroughsRepository` for the pattern.
- Metrics/scores are always recomputed server-side from stored deltas on read — never trust a
  client-supplied value, never patch incrementally.
