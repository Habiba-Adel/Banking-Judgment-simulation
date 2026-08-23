# Banking Judgment in Action : API Design (Final Draft for Review)

Layered architecture: Next.js (view only) -> NestJS Controllers -> Services -> Repositories -> PostgreSQL.

**Auth note:** This service does NOT own user identity. It's one module inside a larger platform
that already handles login/register. Every endpoint below expects an authenticated request
(token/JWT issued by the parent platform, validated here via shared secret or public key) and
reads the user id from that  there is no `/users/register` or `/users/login` in this service.
Confirm with the platform team exactly what token format/validation mechanism to implement
against before building the auth guard.

Modules: `MissionsModule` (content, read-only), `PlaythroughsModule` (playthrough lifecycle),
`AttemptsModule` (mission attempt + decision flow), `ProfileModule` (aggregate reporting).

---

## 1. Missions : content, read-only

### GET /missions
List all 12 missions, summary only.

**Why summary-only:** the Mission Hub just needs title/category/order to render the grid 
loading full step/choice content for all 12 missions upfront would be wasted payload for a
screen that doesn't show it.

Response 200:
```json
[
  { "id": "uuid", "orderIndex": 1, "title": "The Screenshot Shortcut", "category": "Ethics & Data", "description": "..." }
]
```

### GET /missions/:missionId
Full mission detail: 5 steps, each step's characters/messages, and each step's choices.

**Why `metric_deltas` and `outcome_label` are excluded here:** this endpoint may be called to
preview a mission before starting it (or to prefetch content). Choices must appear as plain
options only the scoring behind each one is only ever revealed via the report, never before
or during play, so a user's choice reflects genuine judgment rather than reverse-engineered
scoring.

Response 200:
```json
{
  "id": "uuid",
  "orderIndex": 1,
  "title": "The Screenshot Shortcut",
  "category": "Ethics & Data",
  "description": "...",
  "managerNote": "...",
  "managerName": "Dina Adel",
  "goalText": "...",
  "steps": [
    {
      "id": "uuid",
      "orderIndex": 1,
      "stageLabel": "The request",
      "promptText": "...",
      "characters": [
        { "characterId": "uuid", "name": "Farah Nabil", "role": "Digital Banking Operations Specialist", "message": "Can you send me a screenshot..." }
      ],
      "choices": [
        { "id": "uuid", "labelKey": "A", "labelText": "..." },
        { "id": "uuid", "labelKey": "B", "labelText": "..." }
      ]
    }
  ]
}
```

---

## 2. Playthroughs : the top-level "full run through all 12 missions" container

**Why this layer exists:** a user may complete the simulation more than once (e.g. re-training
months later). Playthrough groups that run's mission attempts together so you can show
"Attempt/Run 2" as a whole, and compare it against a previous run without this layer, there'd
be no clean boundary around "everything the user did this time" versus last time.

### POST /playthroughs
Start a new playthrough. Called once when the user enters the simulation for the first time,
or explicitly starts a new run after finishing/resetting a previous one.

**Business rule** : the user if he had already current progress playthrough he will use it until he choose and making start over choice we will make him start new playthrough 

Response 201:
```json
{ "id": "uuid", "runNumber": 2, "status": "in_progress", "startedAt": "2026-08-22T10:00:00Z" }
```

### GET /playthroughs
List the current user's playthroughs, most recent first. Powers a "your history" view if the
platform wants one; not required for MVP screens, safe to build last.

### GET /playthroughs/:playthroughId
One playthrough's detail, including its mission attempts at summary level (mission id, status,
score) this is what backs the Mission Hub's per-mission checkmarks for a specific run.

### GET /playthroughs/:playthroughId/comparison
Compares this playthrough to the user's immediately previous **completed** playthrough. Backs
the "Performance" view you described current vs. previous run, whether the profile changed,
per-mission score deltas.

**Why this is its own endpoint, not folded into the profile:** comparison only makes sense when
a previous playthrough exists; keeping it separate means the main profile/report endpoints stay
simple and don't need conditional "if previous run exists" branches in their payload shape.

Response 200 (returns null fields if no previous playthrough exists):
```json
{
  "previousRunNumber": 1,
  "currentRunNumber": 2,
  "metricDeltas": { "customerTrust": 8, "complianceSafety": -4 },
  "profileChanged": true,
  "previousProfile": "The Fast Mover",
  "currentProfile": "The Careful Escalator",
  "perMissionDeltas": [
    { "missionId": "uuid", "missionTitle": "The Screenshot Shortcut", "previousScore": 61, "currentScore": 74, "scoreDelta": 13 }
  ]
}
```

### POST /playthroughs/:playthroughId/reset
Resets progress for a **new** run. Does not delete the playthrough being reset it stays in
history for comparison purposes. Practically: marks this playthrough `abandoned` (or leaves it
`completed`/`in_progress` as-is) and the next `POST /playthroughs` call starts a fresh one with
an incremented `runNumber`.

**Why not hard-delete:** deleting would break the comparison feature you just asked for you
can't show "previous run vs current" if the previous run's data was destroyed.

---

## 3. Mission Attempts : one mission, within a playthrough

### POST /playthroughs/:playthroughId/missions/:missionId/attempts
Start an attempt at this mission, within this playthrough. Also used for **replay** always
creates a new attempt row rather than overwriting, so a mission's attempt history is preserved
even if the user replays it multiple times within the same playthrough.

**Auto-resume rule:** if an `in_progress` attempt already exists for this user+mission+playthrough,
this endpoint returns that existing attempt instead of creating a duplicate. A genuinely new
attempt (replay) is only created when the previous one is already `completed`. This is what
makes "close the tab, come back later" work transparently the user never sees a fork in the
road, they just land back where they were.

Response 201 (or 200 if resuming an existing in-progress attempt):
```json
{ "attemptId": "uuid", "missionId": "uuid", "status": "in_progress", "firstStepId": "uuid" }
```

### GET /attempts/:attemptId/current-step
Fetch the next unanswered step for this attempt, plus running metrics so far.

**Why this endpoint exists even though `POST decisions` also returns a "next step" pointer:**
this is specifically for the resume case. When a user reopens the app after leaving mid-mission,
the frontend has no in-memory record of where they were nothing is persisted client-side by
design, so the frontend can't just "continue from where the last POST left off" because that
in-memory state is gone. This endpoint is the frontend's way of asking the server "where was I
in this attempt?" on load, without needing localStorage or any client-side progress tracking.
In the straight-through case (answering steps back-to-back in one sitting), the frontend can
skip calling this again if `POST decisions` already includes the next step's content inline —
worth deciding whether to include full next-step content in that response to save a round trip.

Response 200:
```json
{
  "stepIndex": 3,
  "totalSteps": 5,
  "step": {
    "id": "uuid",
    "stageLabel": "The workaround",
    "promptText": "...",
    "characters": [ { "characterId": "uuid", "name": "...", "message": "..." } ],
    "choices": [ { "id": "uuid", "labelKey": "A", "labelText": "..." } ]
  },
  "runningMetrics": { "customerTrust": 40, "complianceSafety": 36 }
}
```

### POST /attempts/:attemptId/decisions
Submit an answer for the current step.

**Why forward-only / 409 on out-of-order or duplicate:** the mission's narrative path is fixed
(agreed early in the project) a user cannot skip ahead or re-answer a step they've already
passed within the same attempt. This guard also protects against duplicate submissions from
network retries silently double-applying deltas.

Request body:
```json
{ "stepId": "uuid", "choiceId": "uuid" }
```

Response 200 (attempt still in progress):
```json
{
  "runningMetrics": { "customerTrust": 48, "complianceSafety": 44 },
  "isMissionComplete": false,
  "nextStepId": "uuid"
}
```

Response 200 (5th decision : mission just completed):
```json
{ "runningMetrics": { "customerTrust": 78, "complianceSafety": 82 }, "isMissionComplete": true }
```

**Why this response does NOT include the full debrief inline:** keeps this endpoint's payload
small and focused on "did the answer register correctly," and keeps the debrief independently
re-fetchable via its own endpoint below (e.g. if the user navigates away and back to the report
later, without needing to re-answer anything).

Error (out-of-order or duplicate): 409 Conflict
```json
{ "statusCode": 409, "message": "Step has already been answered or is out of sequence" }
```

### GET /attempts/:attemptId/report
Full debrief for a completed attempt re-fetchable anytime afterward (e.g. from Mission Hub,
clicking back into a finished mission).

**Why outcome/explanation text appears here but nowhere earlier:** this is the reflective-
learning payload the whole point of the product per the original project notes. It's
deliberately withheld everywhere upstream (mission preview, current-step, decision response) and
only surfaces here, after the mission is fully committed, so it can't bias in-progress choices.

Response 200:
```json
{
  "missionScore": 58,
  "verdictLabel": "Risky Decision Pattern",
  "finalMetrics": { "customerTrust": 44, "complianceSafety": 83, "dataProtection": 38 },
  "metricDeltas": { "customerTrust": -6, "complianceSafety": 33, "dataProtection": -12 },
  "perDecisionBreakdown": [
    {
      "stepId": "uuid",
      "stageLabel": "The request",
      "choiceLabelText": "Send the screenshot immediately",
      "outcomeLabel": "Critical Breach",
      "explanationText": "Fast, but confidential data left the system.",
      "metricDeltas": { "customerTrust": 4, "complianceSafety": -22, "dataProtection": -30 }
    }
  ]
}
```

---

## 4. Progress :for the Mission Hub display

### GET /playthroughs/:playthroughId/progress
Per-mission completion status for the Mission Hub checkmarks, scoped to one playthrough.

**Why separate from the full profile/report:** the Hub only needs a done/not-done flag and an
attempt id per mission to render checkmarks loading full 7-metric data for all 12 missions
just to draw checkmarks would be unnecessary weight on a screen that doesn't display it.

Response 200:
```json
[
  { "missionId": "uuid", "orderIndex": 1, "completed": true, "lastAttemptId": "uuid" },
  { "missionId": "uuid", "orderIndex": 2, "completed": false, "lastAttemptId": null }
]
```

---

## 5. Profile : aggregate report across a playthrough

### GET /playthroughs/:playthroughId/profile
Aggregate report for one playthrough: overall score, banker profile label, per-mission scores,
behavioral patterns. Computed by summing/deriving across that playthrough's completed attempts not independently stored, to avoid the value ever going stale relative to the underlying decisions.

Response 200:
```json
{
  "overallScore": 58,
  "profileLabel": "Helpful Over-Sharer",
  "profileDescription": "...",
  "finalMetrics": { "customerTrust": 52, "complianceSafety": 55, "dataProtection": 18 },
  "missionScores": [
    { "missionId": "uuid", "title": "The Screenshot Shortcut", "score": 58 },
    { "missionId": "uuid", "title": "The Suspicious Pattern", "score": null }
  ],
  "behaviorPatterns": [
    { "name": "Informal Channel Risk", "level": "Moderate", "signalCount": 3, "tip": "Use approved systems, never chat or screenshots." }
  ]
}
```

---

## Cross-cutting rules

1. Every route below `/playthroughs` and `/attempts` requires a validated platform auth token
   and is scoped to that token's user id never trust a user id passed in the request body/query.
2. `metric_deltas`, `outcome_label`, and `explanation_text` are never sent to the client before
   an answer is submitted for that specific step.
3. Once submitted, `explanation_text`/`outcome_label` for that step ARE shown afterward, via the
   report this is intentional, not an oversight of rule 2.
4. Running/final metrics and mission/playthrough scores are always computed server-side from
   stored decision deltas, recomputed from source on each read rather than trusted from the
   client or incrementally patched this keeps results correct even under retried/out-of-order
   requests.
5. Starting an attempt or playthrough auto-resumes an existing in-progress one rather than
   erroring or duplicating "start over" is an explicit action the user takes from within an
   already-resumed session, not a fork presented up front.
