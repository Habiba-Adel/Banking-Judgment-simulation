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
 * Resolves the current playthrough for the user: resumes an in_progress one
 * if it exists, otherwise creates a new one. Must run before any other
 * Dashboard call — every other endpoint needs the returned playthrough id.
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

export interface MissionAttemptSummary {
  missionId: string;
  status: "in_progress" | "completed";
  missionScore: number | null;
  finalMetrics: Record<string, number> | null;
}

export interface PlaythroughDetail extends Playthrough {
  missionAttempts: MissionAttemptSummary[];
}

/**
 * GET /playthroughs/:playthroughId
 * Feeds the profile gauge and metrics grid: averages missionScore and
 * finalMetrics across this playthrough's completed mission attempts.
 */
export async function fetchPlaythroughDetail(playthroughId: string): Promise<PlaythroughDetail> {
  const res = await fetch(`${API_BASE_URL}/playthroughs/${playthroughId}`);

  if (!res.ok) {
    throw new Error(`fetchPlaythroughDetail failed: ${res.status} ${res.statusText}`);
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
 * Feeds the "Continue where you left off" panel: which missions are
 * completed vs. started vs. untouched.
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
 * Used per in-progress mission on the Continue panel to get how far along
 * the user is (every mission has a fixed 5 decisions).
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

export interface MissionSummary {
  id: string;
  orderIndex: number;
  title: string;
  category: string;
  description: string;
}

/**
 * GET /missions
 * Used to find mission #1's id when starting a brand-new simulation.
 */
export async function fetchMissions(): Promise<MissionSummary[]> {
  const res = await fetch(`${API_BASE_URL}/missions`);

  if (!res.ok) {
    throw new Error(`fetchMissions failed: ${res.status} ${res.statusText}`);
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
 * Starts a fresh attempt for a mission, or resumes an in_progress one.
 * Used by the "Start/Continue Simulation" buttons and each mission card's
 * own "go" action to get an attemptId to navigate into /mission/:attemptId.
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

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
}

/**
 * GET /users/:userId
 * Feeds the Dashboard's greeting ("Welcome back, {displayName}").
 */
export async function fetchUser(userId: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/users/${userId}`);

  if (!res.ok) {
    throw new Error(`fetchUser failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
