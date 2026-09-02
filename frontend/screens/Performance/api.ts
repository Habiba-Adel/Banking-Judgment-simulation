const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Playthrough {
  id: string;
  userId: string;
  runNumber: number;
  status: "in_progress" | "completed" | "abandoned";
}

/**
 * POST /playthroughs
 * Resolves the current playthrough, same bootstrap call as every other screen.
 */
export async function startOrResumePlaythrough(): Promise<Playthrough> {
  const res = await fetch(`${API_BASE_URL}/playthroughs`, { method: "POST" });

  if (!res.ok) {
    throw new Error(`startOrResumePlaythrough failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface MissionSummary {
  id: string;
  orderIndex: number;
  title: string;
  category: string;
  description: string;
}

/**
 * GET /missions
 * Used for mission title/category on scenario rows that aren't completed yet
 * (completed ones get real title/category from their own report instead).
 */
export async function fetchMissions(): Promise<MissionSummary[]> {
  const res = await fetch(`${API_BASE_URL}/missions`);

  if (!res.ok) {
    throw new Error(`fetchMissions failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface MissionProgressEntry {
  missionId: string;
  orderIndex: number;
  title: string;
  completed: boolean;
  lastAttemptId: string | null;
}

/**
 * GET /playthroughs/:playthroughId/progress
 * Which of the (up to) 12 missions are completed — drives scenario counts and
 * which attempts to pull full reports for.
 */
export async function fetchPlaythroughProgress(playthroughId: string): Promise<MissionProgressEntry[]> {
  const res = await fetch(`${API_BASE_URL}/playthroughs/${playthroughId}/progress`);

  if (!res.ok) {
    throw new Error(`fetchPlaythroughProgress failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface DecisionBreakdown {
  decisionId: string;
  orderIndex: number;
  outcomeLabel: string | null;
  metricDeltas: Record<string, number>;
}

export interface AttemptReport {
  missionId: string;
  missionTitle: string;
  missionCategory: string;
  missionScore: number;
  finalMetrics: Record<string, number>;
  startedAt: string;
  completedAt: string | null;
  perDecisionBreakdown: DecisionBreakdown[];
}

/**
 * GET /attempts/:attemptId/report
 * Fetched once per completed mission (N+1 — see conversation) to build every
 * stat that needs decision-level outcomes: accuracy, critical errors, the
 * decision-quality breakdown, and each scenario row's real score/time/date.
 */
export async function fetchAttemptReport(attemptId: string): Promise<AttemptReport> {
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/report`);

  if (!res.ok) {
    throw new Error(`fetchAttemptReport failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}