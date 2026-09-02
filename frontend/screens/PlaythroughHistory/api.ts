const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface PlaythroughSummary {
  id: string;
  runNumber: number;
  status: "in_progress" | "completed" | "abandoned";
}

/**
 * GET /playthroughs
 * Lists every playthrough (run) the user has — attempts of a given mission
 * can be spread across any of these, since a mission can be replayed both
 * within one playthrough and across separate playthrough runs.
 */
export async function fetchPlaythroughs(): Promise<PlaythroughSummary[]> {
  const res = await fetch(`${API_BASE_URL}/playthroughs`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`fetchPlaythroughs failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface AttemptRow {
  id: string;
  missionId: string;
  status: "in_progress" | "completed";
  missionScore: number | null;
  finalMetrics: Record<string, number> | null;
  startedAt: string;
  completedAt: string | null;
}

export interface PlaythroughDetail {
  id: string;
  missionAttempts: AttemptRow[];
}

/**
 * GET /playthroughs/:playthroughId
 * Used per playthrough to find every attempt of the target mission within it.
 */
export async function fetchPlaythroughDetail(playthroughId: string): Promise<PlaythroughDetail> {
  const res = await fetch(`${API_BASE_URL}/playthroughs/${playthroughId}`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`fetchPlaythroughDetail failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface DecisionBreakdown {
  decisionId: string;
  orderIndex: number;
  stageLabel: string;
  outcomeLabel: string | null;
  metricDeltas: Record<string, number>;
}

export interface AttemptReport {
  missionTitle: string;
  missionScore: number;
  finalMetrics: Record<string, number>;
  startedAt: string;
  completedAt: string | null;
  perDecisionBreakdown: DecisionBreakdown[];
}

/**
 * GET /attempts/:attemptId/report
 * Fetched once per attempt actually being compared (max 3) — this is the
 * only place decision-level outcomes live, needed for the by-decision table.
 */
export async function fetchAttemptReport(attemptId: string): Promise<AttemptReport> {
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/report`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`fetchAttemptReport failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface MissionSummary {
  id: string;
  orderIndex: number;
  title: string;
}

/**
 * GET /missions
 * Needed to know this mission's place in the sequence (for "Go to Next
 * Mission") and every mission's title (for the per-mission journey table).
 */
export async function fetchMissions(): Promise<MissionSummary[]> {
  const res = await fetch(`${API_BASE_URL}/missions`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`fetchMissions failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface PlaythroughStart {
  id: string;
}

/**
 * POST /playthroughs
 * Resolves the user's current (in-progress) playthrough — same bootstrap
 * call Situations uses — needed to start the next mission's attempt under.
 */
export async function startOrResumePlaythrough(): Promise<PlaythroughStart> {
  const res = await fetch(`${API_BASE_URL}/playthroughs`, { method: "POST" });

  if (!res.ok) {
    throw new Error(`startOrResumePlaythrough failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * POST /playthroughs/:playthroughId/reset
 * Marks the playthrough abandoned — does NOT delete it, it stays in history
 * for comparison — so the next startOrResumePlaythrough() call starts a
 * genuinely fresh run instead of resuming this one.
 */
export async function resetPlaythrough(playthroughId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/playthroughs/${playthroughId}/reset`, { method: "POST" });

  if (!res.ok) {
    throw new Error(`resetPlaythrough failed: ${res.status} ${res.statusText}`);
  }
}

export interface AttemptStart {
  attemptId: string;
}

/**
 * POST /playthroughs/:playthroughId/missions/:missionId/attempts
 * Starts (or resumes) the next mission's attempt so "Go to Next Mission" has
 * somewhere real to navigate to.
 */
export async function startOrResumeAttempt(playthroughId: string, missionId: string): Promise<AttemptStart> {
  const res = await fetch(`${API_BASE_URL}/playthroughs/${playthroughId}/missions/${missionId}/attempts`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`startOrResumeAttempt failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}