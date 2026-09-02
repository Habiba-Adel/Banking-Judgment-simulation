const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface DecisionBreakdown {
  decisionId: string;
  orderIndex: number;
  stageLabel: string;
  promptText: string;
  choiceId: string;
  choiceLabel: string;
  outcomeLabel: string | null;
  explanationText: string | null;
  metricDeltas: Record<string, number>;
}

export interface AttemptReport {
  status: "in_progress" | "completed";
  playthroughId: string;
  missionId: string;
  missionTitle: string;
  missionCategory: string;
  missionDescription: string;
  coachName: string;
  coachFeedback: string;
  missionScore: number;
  finalMetrics: Record<string, number>;
  perDecisionBreakdown: DecisionBreakdown[];
  missionCharacters: Array<{ id: string; name: string; role: string }>;
}

/**
 * GET /attempts/:attemptId/report
 * The full debrief for a completed attempt — drives every card on this screen.
 */
export async function fetchAttemptReport(attemptId: string): Promise<AttemptReport> {
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/report`);

  if (!res.ok) {
    throw new Error(`fetchAttemptReport failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface AttemptStart {
  attemptId: string;
  status: "in_progress" | "completed";
  resumed: boolean;
}

/**
 * POST /playthroughs/:playthroughId/missions/:missionId/attempts
 * Used by the "Replay" button — starts a fresh attempt for the same mission.
 */
export async function startOrResumeAttempt(
  playthroughId: string,
  missionId: string,
): Promise<AttemptStart> {
  const res = await fetch(`${API_BASE_URL}/playthroughs/${playthroughId}/missions/${missionId}/attempts`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`startOrResumeAttempt failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}