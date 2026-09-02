const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface MissionDetail {
  id: string;
  orderIndex: number;
  title: string;
  category: string;
  description: string;
  managerNote: string;
  managerName: string;
  goalText: string;
  steps: Array<{ id: string; orderIndex: number; stageLabel: string }>;
}

/**
 * GET /missions/:missionId
 * Feeds the mission title/category/description/goal shown throughout the
 * mission screen — fetched once we know the mission id from the first
 * current-step response.
 */
export async function fetchMissionDetail(missionId: string): Promise<MissionDetail> {
  const res = await fetch(`${API_BASE_URL}/missions/${missionId}`);

  if (!res.ok) {
    throw new Error(`fetchMissionDetail failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface StepCharacter {
  name: string;
  role: string;
  message: string;
  orderIndex: number;
}

export interface StepChoice {
  id: string;
  labelKey: string;
  labelText: string;
}

export interface CurrentStepData {
  id: string;
  missionId: string;
  orderIndex: number;
  stageLabel: string;
  promptText: string;
  contextText: string;
  characters: StepCharacter[];
  choices: StepChoice[];
}

export type PressureLevel = "Low" | "Moderate" | "Medium-High" | "High" | "Critical";
export type PressureTier = "Low" | "Medium" | "High";

export interface Pressure {
  level: PressureLevel;
  expectation: PressureTier;
  time: PressureTier;
}

export interface CurrentStepResult {
  step: CurrentStepData | null;
  runningMetrics: Record<string, number>;
  pressure: Pressure;
  isComplete: boolean;
}

/**
 * GET /attempts/:attemptId/current-step
 * Drives the whole mission screen: the active step's prompt/choices/characters,
 * plus running metrics and derived situation pressure.
 */
export async function fetchCurrentStep(attemptId: string): Promise<CurrentStepResult> {
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/current-step`);

  if (!res.ok) {
    throw new Error(`fetchCurrentStep failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface SubmitDecisionResult {
  isMissionComplete: boolean;
  nextStepId: string | null;
}

/**
 * POST /attempts/:attemptId/decisions
 * Submits the player's choice for the current decision.
 */
export async function submitDecision(
  attemptId: string,
  decisionId: string,
  choiceId: string,
): Promise<SubmitDecisionResult> {
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/decisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decisionId, choiceId }),
  });

  const bodyText = await res.text();

  if (!res.ok) {
    let message = `submitDecision failed: ${res.status} ${res.statusText}`;
    try {
      const parsed = JSON.parse(bodyText);
      message = parsed.message ?? message;
    } catch {
      // body wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  return JSON.parse(bodyText);
}