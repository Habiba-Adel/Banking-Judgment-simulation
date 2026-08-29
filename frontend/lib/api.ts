
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${options?.method ?? "GET"} ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

export interface BackendMission {
  id: string;
  orderIndex: number;
  title: string;
  category: string;
  description: string;
}

export interface BackendMissionDetail extends BackendMission {
  managerNote: string;
  managerName: string;
  goalText: string;
  steps: Array<{
    id: string;
    orderIndex: number;
    stageLabel: string;
    promptText: string;
    contextText: string;
    choices: Array<{ id: string; labelKey: string; labelText: string }>;
    characters: Array<{ name: string; role: string; message: string; orderIndex: number }>;
  }>;
}

export interface BackendCurrentStep {
  step: {
    id: string;
    missionId: string;
    orderIndex: number;
    stageLabel: string;
    promptText: string;
    contextText: string;
    characters: Array<{ name: string; role: string; message: string; orderIndex: number }>;
    choices: Array<{ id: string; labelKey: string; labelText: string }>;
  } | null;
  isComplete: boolean;
}

export const api = {
  getMissions: () => request<BackendMission[]>("/missions"),

  getMissionDetail: (missionId: string) =>
    request<BackendMissionDetail>(`/missions/${missionId}`),

  getCharacters: () =>
    request<Array<{ id: string; name: string; role: string; avatarUrl: string | null }>>(
      "/characters",
    ),

  startOrResumePlaythrough: () =>
    request<{ id: string; runNumber: number; status: string }>("/playthroughs", {
      method: "POST",
    }),

  startOrResumeAttempt: (playthroughId: string, missionId: string) =>
    request<{ attemptId: string; status: string; resumed: boolean }>(
      `/playthroughs/${playthroughId}/missions/${missionId}/attempts`,
      { method: "POST" },
    ),

  getCurrentStep: (attemptId: string) =>
    request<BackendCurrentStep>(`/attempts/${attemptId}/current-step`),

  // NOTE: backend field is "decisionId" (their name for a Step), not "stepId".
  submitDecision: (attemptId: string, decisionId: string, choiceId: string) =>
    request<{ isMissionComplete: boolean; nextStepId: string | null }>(
      `/attempts/${attemptId}/decisions`,
      {
        method: "POST",
        body: JSON.stringify({ decisionId, choiceId }),
      },
    ),

  getReport: (attemptId: string) =>
    request<{
      status: string;
      missionTitle: string;
      coachName: string;
      coachFeedback: string;
      missionScore: number;
      finalMetrics: Record<string, number>;
      perDecisionBreakdown: Array<{
        stageLabel: string;
        choiceLabel: string;
        outcomeLabel: string | null;
        explanationText: string | null;
        metricDeltas: Record<string, number>;
      }>;
      missionCharacters: Array<{ id: string; name: string; role: string }>;
    }>(`/attempts/${attemptId}/report`),
};