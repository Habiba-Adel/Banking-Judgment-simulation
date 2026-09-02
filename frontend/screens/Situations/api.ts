const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Playthrough {
  id: string;
  userId: string;
  runNumber: number;
  status: "in_progress" | "completed" | "abandoned";
  finalMetrics: Record<string, number> | null;
  profileResult: string | null;
  startedAt: string;
  completedAt: string | null;
}

/**
 * POST /playthroughs
 * Resolves the current playthrough for the user, same bootstrap call as the
 * Dashboard — every other call on this screen needs the returned id.
 */
export async function startOrResumePlaythrough(): Promise<Playthrough> {
  const res = await fetch(`${API_BASE_URL}/playthroughs`, {
    method: "POST",
  });

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
 * Feeds the category sections and each MissionCard's title/description —
 * grouped by `category` client-side since the backend has no category entity.
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
 * Feeds each MissionCard's status: not_started / in_progress / completed.
 */
export async function fetchPlaythroughProgress(playthroughId: string): Promise<MissionProgressEntry[]> {
  const res = await fetch(`${API_BASE_URL}/playthroughs/${playthroughId}/progress`);

  if (!res.ok) {
    throw new Error(`fetchPlaythroughProgress failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

const TOTAL_STEPS_PER_MISSION = 5;

export interface CurrentStepResult {
  currentStep: number;
  totalSteps: number;
  isComplete: boolean;
}

/**
 * GET /attempts/:attemptId/current-step
 * Used per in-progress mission to show "Step N of 5" on its card.
 */
export async function fetchCurrentStep(attemptId: string): Promise<CurrentStepResult> {
  const res = await fetch(`${API_BASE_URL}/attempts/${attemptId}/current-step`);

  if (!res.ok) {
    throw new Error(`fetchCurrentStep failed: ${res.status} ${res.statusText}`);
  }

  const data: { step: { orderIndex: number } | null; isComplete: boolean } = await res.json();

  return {
    currentStep: data.step?.orderIndex ?? TOTAL_STEPS_PER_MISSION,
    totalSteps: TOTAL_STEPS_PER_MISSION,
    isComplete: data.isComplete,
  };
}

export interface AttemptStart {
  attemptId: string;
  status: "in_progress" | "completed";
  resumed: boolean;
}

/**
 * POST /playthroughs/:playthroughId/missions/:missionId/attempts
 * Starts a fresh attempt or resumes one, used by each MissionCard's
 * Start/Continue/Replay action to get an attemptId to navigate into.
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