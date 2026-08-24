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
| `db/schema.ts` | shared foundation | all 8 core tables + `step_characters` (see schema note below) | done, live |
| DB instance setup + migrations | teammate | Neon Postgres instance, `drizzle.config.ts`, migrations, `seed.ts` | **done** — merged via PR #6 (`b37f398`/`e30eaaa`) 2026-08-24 |
| `MissionsModule` | — | `GET /missions`, `GET /missions/:missionId` | done, verified live against Neon |
| `PlaythroughsModule` | — | `POST /playthroughs`, `GET /playthroughs`, `GET /playthroughs/:id`, `GET /playthroughs/:id/comparison`, `POST /playthroughs/:id/reset` | done, verified live against Neon |
| `AttemptsModule` | teammate | mission attempt + decision flow | done, verified live against Neon 2026-08-24 |
| `UsersModule` / auth | teammate | placeholder `users` table now, real auth later | not started |

**Note:** the database is now live on Neon (see "Database setup" below) with migrations and seed
data applied by the teammate — the earlier "no live database" state described in prior versions
of this file no longer applies.

Playthroughs hands off to Attempts: `POST /playthroughs/:playthroughId/missions/:missionId/attempts`
lives in AttemptsModule but is nested under a playthrough — keep that FK relationship (`mission_attempts.playthrough_id`)
in mind when working across the boundary.

## Database schema (9 tables) — full field-level spec

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

**`characters`** (content, static, read-only at runtime) — **normalized 2026-08-24, replaces the
old one-row-per-appearance design below**

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | varchar | |
| role | varchar | |
| created_at | timestamp | |

**`step_characters`** (content, static, read-only at runtime) — join table added 2026-08-24,
links a `characters` roster row to a `decisions` row with that step's specific line

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| decision_id | uuid, FK → decisions | |
| character_id | uuid, FK → characters | |
| message | text | this step's specific line for this character |
| order_index | int | render order within the decision when multiple characters appear |
| created_at | timestamp | |

Changed by the teammate in PR #6 from the original design (one `characters` row per
character-*appearance*-in-a-decision, with `name`/`role` duplicated across missions) to a real
roster + join table — fixes the duplication the original design deliberately accepted.
`MissionsRepository.findMissionById` joins `step_characters` → `characters`; watch for
self-join mistakes here (a real bug shipped in the initial PR #6 version — `.from(characters)
.innerJoin(characters, ...)` referenced the same table twice instead of
`.from(stepCharacters).innerJoin(characters, ...)` — fixed 2026-08-24, commit `e87c447`).

**`choices`** (content, static, read-only at runtime)

| Field | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| decision_id | uuid, FK → decisions | |
| label_key | char(1) | A/B/C/D |
| label_text | varchar | |
| metric_deltas | json | 7 keys: `customerTrust`, `complianceSafety`, `dataProtection`, `decisionQuality`, `accountability`, `reputationRisk`, `responsibleBanking` |
| outcome_label | varchar, nullable | added by teammate 2026-08-24 — e.g. "Excellent"/"Risky"/"Critical Breach", surfaced only via the attempt report, per rule 5 below |
| explanation_text | text, nullable | added by teammate 2026-08-24 — same visibility rule as `outcome_label` |
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

## Database setup (live, on Neon — set up by the teammate in PR #6, 2026-08-24)

The database is a shared Neon Postgres instance (not local Postgres). `backend/drizzle.config.ts`
and `db/db.module.ts` point at it; the latter does a `SELECT 1` health check on boot and throws if
the connection fails, and uses `ssl: { rejectUnauthorized: false }` since Neon requires SSL.

1. **Add `backend/.env`** (gitignored, never commit real values here) with the real Neon
   host/user/password/db — ask a teammate for the current credentials out-of-band (Slack/DM), not
   via a committed file. **Do not put real credentials in `.env.example`** — see the incident note
   below for why this matters.
2. Migrations already exist in `backend/drizzle/` (`0000_calm_ender_wiggin.sql` through
   `0002_hesitant_ser_duncan.sql`) and are applied to the live Neon DB — no need to regenerate
   unless `schema.ts` changes again.
3. **Seed data**: `backend/seed.ts` seeds mission 1 & 2 content plus a placeholder `users` row
   (id `00000000-0000-0000-0000-000000000001`, matching `PLACEHOLDER_USER_ID` in
   `playthroughs.controller.ts`) — `PlaythroughsModule` writes fail on the `users` FK without this
   row. Run with `npx ts-node seed.ts` from `backend/`. It's safe to re-run: the placeholder user
   uses `onConflictDoNothing()`, and `clearMission()` deletes+recreates missions 1/2 by title
   before reinserting (so re-running rotates those missions' row ids — re-fetch from
   `GET /missions` after reseeding rather than reusing old ids).
4. Verify connectivity: run the app (`npm run start:dev`) and check for
   `[DbModule] ✅ Database connection established successfully` in the boot log, or query directly
   with `psql "host=$DB_HOST port=$DB_PORT user=$DB_USER dbname=$DB_NAME sslmode=require" -c "\dt"`
   (should list 9 tables, including `step_characters`).

### Incident: leaked Neon credentials in `.env.example` (2026-08-24, resolved)

PR #6 accidentally committed real, working Neon credentials into `backend/.env.example` (which is
meant to be a fake-value template, not a real config) — host, user, and a live password, pushed to
GitHub in commit `b37f398`. Fixed in commit `e87c447`: `.env.example` now holds placeholder values
only. **The old password is still visible in git history** (that fix doesn't remove it from past
commits) — it should be treated as compromised and rotated from the Neon dashboard; this had not
been done as of 2026-08-24. Lesson: never copy a working `.env` into `.env.example` — always write
fake placeholder values by hand.

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
- `GET /playthroughs/:playthroughId/progress` — lightweight per-mission checklist: all missions
  with `completed` (bool, true once any attempt for that mission is `completed`) and
  `lastAttemptId`. Added alongside `AttemptsModule`, not originally listed in this file's earlier
  Playthroughs scope — verified working 2026-08-24.

No auth exists yet, so the controller currently reads the acting user from a hardcoded
`PLACEHOLDER_USER_ID` constant in `playthroughs.controller.ts` rather than a validated token.
Swap that for a real `@CurrentUser()`/guard once auth lands — every service/repository call site
already takes `userId` as a plain parameter, so the swap is localized to the controller.

### Mission Attempts (teammate's module — not built by me, kept here so Playthroughs integrates
cleanly) — **implemented and verified end-to-end against live Neon data 2026-08-24**, see
`backend/src/attempts/`

- `POST /playthroughs/:playthroughId/missions/:missionId/attempts` — start/resume an attempt.
  Auto-resumes an `in_progress` attempt for this user+mission+playthrough; only creates a new one
  (replay) once the previous is `completed`. Verified.
- `GET /attempts/:attemptId/current-step` — the next unanswered step + its `choices`/`characters`.
  Exists specifically for the "reopen the app after leaving mid-mission" case — nothing is
  tracked client-side, so the frontend needs a way to ask "where was I?" on load. Returns
  `{ step: null, isComplete: true }` once all 5 decisions are answered. Verified, including the
  completed-mission case.
- `POST /attempts/:attemptId/decisions` — submit `{ decisionId, choiceId }` (note: body key is
  `decisionId`, not `stepId` as `docs/api-design-final.md` names it — worth reconciling with the
  doc later, but this is what's actually implemented/tested). Forward-only; out-of-order or
  duplicate submission → `409 Conflict`; submitting to an already-`completed` attempt → `400 Bad
  Request` ("Attempt is already completed"). Returns `{ isMissionComplete, nextStepId }`,
  deliberately **without** the full debrief inline (that's its own re-fetchable endpoint below).
  Verified, including the 400-on-completed-attempt guard.
- `GET /attempts/:attemptId/report` — full debrief for a completed attempt: `status`,
  `missionTitle`, `coachName`/`coachFeedback`, `missionScore`, `finalMetrics`, and
  `perDecisionBreakdown` with `outcomeLabel`/`explanationText` per decision, plus
  `missionCharacters`. This is the **only** place outcome/explanation text is ever exposed, and
  only once the mission is fully committed — deliberately withheld everywhere upstream so it can't
  bias in-progress choices. Verified — but see the seed-data gap noted below.

**Known content gap (not a code bug):** for mission "The Screenshot Shortcut" (`e207d14c-a6c8-4c97-ab99-482745fd9250`),
decisions at `orderIndex` 3 ("The workaround") and 5 ("Final resolution") return
`outcomeLabel: null`, `explanationText: null`, and all-zero `metricDeltas` in the report for at
least one choice on each (`cf8d4d2a...` and `6ec89356...` respectively) — the other 3 decisions in
that mission return real values. Looks like those specific `choices` rows are missing
`outcome_label`/`explanation_text`/non-zero `metric_deltas` in `seed.ts`, not an app bug. Not yet
investigated further — check `seed.ts`'s content for this mission next time this comes up.

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
