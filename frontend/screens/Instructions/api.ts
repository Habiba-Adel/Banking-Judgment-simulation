const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Character {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

/**
 * GET /characters
 * Feeds "The cast you'll face" — every character across all missions.
 */
export async function fetchCharacters(): Promise<Character[]> {
  const res = await fetch(`${API_BASE_URL}/characters`);

  if (!res.ok) {
    throw new Error(`fetchCharacters failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export interface PlaythroughStart {
  id: string;
}

/**
 * POST /playthroughs
 * Resolves the user's current (in-progress) playthrough — same bootstrap
 * call every other screen uses.
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
 * Marks the playthrough abandoned (kept in history, not deleted) so the next
 * startOrResumePlaythrough() call starts a genuinely fresh run.
 */
export async function resetPlaythrough(playthroughId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/playthroughs/${playthroughId}/reset`, { method: "POST" });

  if (!res.ok) {
    throw new Error(`resetPlaythrough failed: ${res.status} ${res.statusText}`);
  }
}
